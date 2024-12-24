from db_connection import db
from datetime import datetime
import bcrypt
import random
import uuid
from sqlalchemy.orm import sessionmaker 
from sqlalchemy.exc import SQLAlchemyError 
from sqlalchemy.dialects.mysql import insert
from sqlalchemy import func
import models 



def generate_unique_uuid4(session):
    while True:
        # Generate a new UUID
        new_uuid = str(uuid.uuid4())

        # Check if the UUID already exists in the Doctor table
        existing_uuid = session.query(models.Doctor).filter(models.Doctor.license_number == new_uuid).first()

        # If no existing UUID is found, return the new UUID
        if not existing_uuid:
            return new_uuid
        
"""
    user_info (dict)
        - role_id
        - username
        - password_hash
        - email
        - first_name
        - last_name
    
    role_info (dict)
        - doctor: {'phone_number', 'speciality', 'license_number'}
        - patient: {'age', 'gender', 'phone_number', 'address'}
"""
def insert_user(user_info, role_info):
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        try:
            # Check if the user already exists based on username or email
            existing_user = session.query(models.User).filter(
                (models.User.username == user_info['username']) | 
                (models.User.email == user_info['email'])
            ).first()

            if existing_user:
                return {"status": "error", "message": "User already exists with this username or email."}

            # Hash the password
            hashed_password = bcrypt.hashpw(user_info['password_hash'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            current_datetime = datetime.now()

            # Create a new User object
            new_user = models.User(
                role_id_fk=user_info['role_id'],
                username=user_info['username'],
                password_hash=hashed_password,
                email=user_info['email'],
                first_name=user_info['first_name'],
                last_name=user_info['last_name'],
                #created_at=current_datetime,
                #updated_at=current_datetime  
            )

            # Add the User object to the session
            session.add(new_user)
            session.flush()  # Flush to get the user_id

            # Insert the associated role-specific details (doctor or patient)
            if user_info['role_id'] == 1:  # doctor role
                license_number = generate_unique_uuid4(session)
                new_doctor = models.Doctor(
                    user_id_fk=new_user.user_id,
                    phone_number=role_info['phone_number'],
                    specialty=role_info['specialty'],
                    license_number=license_number
                )
                session.add(new_doctor)

            elif user_info['role_id'] == 2:  # patient role
                new_patient = models.Patient(
                    user_id_fk=new_user.user_id,
                    age=role_info['age'],
                    gender=role_info['gender'],
                    phone_number=role_info['phone_number'],
                    address=role_info['address']
                )
                session.add(new_patient)

            # Commit all changes to the database
            session.commit()
            
            return {"status": "success", "message": "User and related record inserted successfully."}
        
        except SQLAlchemyError as e:
            # Rollback in case of an error
            session.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}

"""
appointment_id, patient_id_fk (composite key)
appointment_info:
# - patient_id_fk //session
# - doctor_id_fk //you query

- date YYYY-MM-DD
- time
- type
"""
def insert_appointment(appointment_info):
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Get the max appointment ID for the current patient
            max_appointment_id = session.query(func.max(models.Appointment.appointment_id)) \
                                         .filter(models.Appointment.patient_id_fk == appointment_info['patient_id']) \
                                         .scalar()

            new_appointment_id = 0 if max_appointment_id is None else max_appointment_id + 1

            # Check for available doctors on the given date and time
            available_doctors = session.query(models.Doctor.doctor_id) \
                                       .outerjoin(models.Appointment, 
                                                  (models.Doctor.doctor_id == models.Appointment.doctor_id_fk) & 
                                                  (models.Appointment.date == appointment_info['date']) & 
                                                  (models.Appointment.time == appointment_info['time'])) \
                                       .filter(models.Appointment.doctor_id_fk == None) \
                                       .all()

            if not available_doctors:
                return {"status": "error", "message": "No doctors are available at the selected date and time."}

            # Randomly assign a doctor
            assigned_doctor = random.choice(available_doctors)[0]

            # Insert the new appointment
            new_appointment = models.Appointment(
                appointment_id=new_appointment_id,
                patient_id_fk=appointment_info['patient_id'],
                doctor_id_fk=assigned_doctor,
                date=appointment_info['date'],
                time=appointment_info['time'],
                status='pending',
                type=appointment_info['type']
            )

            session.add(new_appointment)
            session.commit()

            return {
                "status": "success",
                "message": f"Appointment added successfully with doctor ID: {assigned_doctor} for appointment ID: {new_appointment_id}"
            }

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}
        

"""
diagnosis_info:
- patient_id_
- diagnosis_description
- doctor_id_fk
- severity

inside medications_info:
    medication_info:
    - patient_id
    - medication_id
    - doctor_id
    - dosage
    - frequency
    - start_date YYYY-MM-DD
    - end_date YYYY-MM-DD
"""
def insert_diagnosis(diagnosis_info, medications_info):
    """
    Inserts a new diagnosis and associated medications into the database using SQLAlchemy ORM.

    :param diagnosis_info: Dictionary containing diagnosis details (patient_id, diagnosis_description, doctor_id, severity, appointment_id)
    :param medications_info: List of dictionaries containing medication details for the diagnosis
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Insert diagnosis
            current_date = datetime.now().strftime('%Y-%m-%d')
            new_diagnosis = models.Diagnosis(
                patient_id_fk=diagnosis_info['patient_id'],
                diagnosis_description=diagnosis_info['diagnosis_description'],
                doctor_id_fk=diagnosis_info['doctor_id'],
                diagnosis_date=current_date,
                severity=diagnosis_info['severity'],
                appointment_id_fk=diagnosis_info['appointment_id']
            )
            session.add(new_diagnosis)
            session.flush()  # Flush to get the `diagnosis_id` for medications

            # Insert medications
            for medication in medications_info:
                new_medication = models.PatientMedication(
                    patient_id_fk=medication['patient_id'],
                    medication_id_fk=medication['medication_id'],
                    doctor_id_fk=medication['doctor_id'],
                    diagnosis_id_fk=new_diagnosis.diagnosis_id,  # Use `diagnosis_id` from the flushed diagnosis
                    dosage=medication['dosage'],
                    frequency=medication['frequency'],
                    duration=medication['duration']
                )
                session.add(new_medication)

            # Update appointment status
            appointment = session.query(models.Appointment).filter_by(
                appointment_id=diagnosis_info['appointment_id']
            ).first()
            if appointment:
                appointment.status = 'completed'

            # Commit all changes
            session.commit()

            return {"status": "success", "message": "Diagnosis added successfully."}

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

"""

billing_id, patient_id_fk, appointment_id_fk (composite key)
billing_info:
- patient_id 
- appointment_id
- amount_due
- amount_paid
- billing_date
- payment_method
"""
def insert_billing(billing_info):
    """
    Inserts a new billing record into the database using SQLAlchemy ORM.

    :param billing_info: Dictionary containing billing details (patient_id, appointment_id, amount_due, amount_paid, billing_date, payment_method)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Get the max billing ID for the current patient
            max_billing_id = session.query(func.max(models.Billing.billing_id)) \
                                    .filter(models.Billing.patient_id_fk == billing_info['patient_id']) \
                                    .scalar()

            new_billing_id = 0 if max_billing_id is None else max_billing_id + 1

            # Insert the billing information with the new billing ID
            new_billing = models.Billing(
                billing_id=new_billing_id,
                patient_id_fk=billing_info['patient_id'],
                appointment_id_fk=billing_info['appointment_id'],
                amount_due=billing_info['amount_due'],
                amount_paid=billing_info['amount_paid'],
                billing_date=billing_info.get('billing_date', datetime.now().strftime('%Y-%m-%d')),
                payment_status='pending',  # Default to pending
                payment_method=billing_info['payment_method']
            )

            session.add(new_billing)
            session.commit()

            return {"status": "success", "message": f"Billing added successfully with billing ID: {new_billing_id}"}

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

"""
On Assumption that it is a single insert
condition_info:
- name
- description

"""
def insert_medical_conditions(condition_info=None):
    """
    Inserts or updates a medical condition in the database using SQLAlchemy ORM.

    :param condition_info: Dictionary containing medical condition details (name, description)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Create an insert statement with an ON DUPLICATE KEY UPDATE equivalent
            stmt = insert(models.MedicalCondition).values(
                name=condition_info['name'],
                description=condition_info['description']
            ).on_duplicate_key_update(
                name=condition_info['name'],
                description=condition_info['description']
            )

            # Execute the statement
            session.execute(stmt)
            session.commit()

            return {"status": "success", "message": "Medical condition added/updated successfully."}

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}
        

"""
On Assumption that it is a single insert
medication_info:
- name
- description
- price

"""
def insert_medication(medication_info=None):
    """
    Inserts or updates a medication in the database using SQLAlchemy ORM.

    :param medication_info: Dictionary containing medication details (name, description, price)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Create an insert statement with an ON DUPLICATE KEY UPDATE equivalent
            stmt = insert(models.Medication).values(
                name=medication_info['name'],
                description=medication_info['description'],
                price=medication_info['price']
            ).on_duplicate_key_update(
                name=medication_info['name'],
                description=medication_info['description'],
                price=medication_info['price']
            )

            # Execute the statement
            session.execute(stmt)
            session.commit()

            return {"status": "success", "message": "Medication added/updated successfully."}

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

        


