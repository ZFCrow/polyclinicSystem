from db_connection import db
from datetime import datetime
import random
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import models
import time
"""
user_info:
- username
- email
- password
- last_name
- phone_number
- address
"""

#!
def update_user_info(user_id, user_info):
    """
    Update user information in the database using SQLAlchemy ORM with `updated_at` for conflict detection.

    :param user_id: ID of the user to update
    :param user_info: Dictionary containing updated user details
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        try:
            # Phase 1: Read - Fetch the current state of the user
            user = session.query(models.User).filter_by(user_id=user_id).first()
            if not user:
                return {"status": "error", "message": "User not found."}

            # Save the original state for validation
            original_updated_at = user.updated_at

            # Phase 2: Write - Apply the updates with optimistic locking
            update_query = (
                session.query(models.User)
                .filter(models.User.user_id == user_id, models.User.updated_at == original_updated_at)
                .update(
                    {
                        models.User.username: user_info.get("username", user.username),
                        models.User.email: user_info.get("email", user.email),
                        models.User.first_name: user_info.get("first_name", user.first_name),
                        models.User.last_name: user_info.get("last_name", user.last_name),
                        models.User.updated_at: datetime.now(),  # Update the timestamp
                    }
                )
            )

            # Check if the update succeeded (1 row affected)
            if update_query == 0:
                raise ValueError(
                    "Conflict detected: The record has been modified by another transaction."
                )

            # Role-specific updates
            role_id = user.role_id_fk
            if role_id == 1:  # Doctor-specific updates
                doctor = session.query(models.Doctor).filter_by(user_id_fk=user_id).first()
                if doctor:
                    doctor.phone_number = user_info.get("phone_number", doctor.phone_number)
                    doctor.specialty = user_info.get("specialty", doctor.specialty)
            elif role_id == 2:  # Patient-specific updates
                patient = session.query(models.Patient).filter_by(user_id_fk=user_id).first()
                if patient:
                    patient.phone_number = user_info.get("phone_number", patient.phone_number)
                    patient.address = user_info.get("address", patient.address)
                    patient.age = int(user_info.get("age", patient.age))

            # Commit the changes
            session.commit()

            return {"status": "success", "message": "User information updated successfully."}

        except ValueError as ve:
            session.rollback()
            return {"status": "error", "message": f"Validation failed: {str(ve)}"}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}

        except KeyError as ke:
            session.rollback()
            return {"status": "error", "message": f"Missing required data: {str(ke)}"}

        except Exception as e:
            session.rollback()
            return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}


"""
appointment_info:
- date
- time
- type
"""
def update_appointment(patient_id, appointment_id, appointment_info):
    """
    Update an appointment in the database using SQLAlchemy ORM.

    :param patient_id: ID of the patient
    :param appointment_id: ID of the appointment to update
    :param appointment_info: Dictionary containing the updated appointment details (date, time, type)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  
    with Session() as session:
        try:
            # Fetch the appointment to update
            # phase 1: Read - Fetch the current state of the appointment 
            appointment = session.query(models.Appointment).filter_by(
                appointment_id=appointment_id,
                patient_id_fk=patient_id
            ).first()

            if not appointment:
                return {"status": "error", "message": "Appointment not found for the given patient."}

            # save the original state for validation 
            original_updated_at = appointment.updated_at 
            # Update the appointment details
            # appointment.date = appointment_info['date']
            # appointment.time = appointment_info['time']
            # appointment.type = appointment_info['type']

            #phase 2 - Write - Apply the updates with optimistic locking 
            update_query = ( 
                session.query(models.Appointment)
                .filter(models.Appointment.appointment_id == appointment_id, models.Appointment.updated_at == original_updated_at)
                .update(
                    {
                        models.Appointment.date: appointment_info.get("date", appointment.date),
                        models.Appointment.time: appointment_info.get("time", appointment.time),
                        models.Appointment.type: appointment_info.get("type", appointment.type)
                    }
                )
            ) 

            # Check if the update succeeded (1 row affected) 
            if update_query == 0: 
                raise ValueError(
                    "Conflict detected: The record has been modified by another transaction." 
                ) 
            
            # Commit the changes
            session.commit()

            return {"status": "success", "message": "Appointment updated successfully."}

        except KeyError as ke:
            session.rollback()
            return {"status": "error", "message": f"Missing data in appointment_info: {str(ke)}"}
        except ValueError as ve:
            session.rollback()
            return {"status": "error", "message": f"Validation failed: {str(ve)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            session.rollback() 
            return {"status": "error", "message": f"An error occurred: {str(e)}"}


"""
assuming user pays full of the amount due

payment_info:
- amount_paid
- payment_method
"""
def update_billing_status(billing_id, appointment_id, patient_id, payment_info):
    """
    Updates the billing status in the database using SQLAlchemy ORM.

    :param billing_id: ID of the billing record to update
    :param appointment_id: ID of the associated appointment
    :param patient_id: ID of the associated patient
    :param payment_info: Dictionary containing payment details (amount_paid, payment_method)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Fetch the billing record to update
            billing_record = session.query(models.Billing).filter_by(
                billing_id=billing_id,
                appointment_id_fk=appointment_id,
                patient_id_fk=patient_id
            ).first()

            if not billing_record:
                return {"status": "error", "message": "Billing record not found."}

            # Update billing fields
            billing_record.amount_paid = payment_info['amount_paid']
            billing_record.billing_date = datetime.now().strftime('%Y-%m-%d')
            billing_record.payment_status = 'paid'
            billing_record.payment_method = payment_info['payment_method']

            # Commit changes to the database
            session.commit()

            return {"status": "success", "message": "Billing status updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in payment_info: {str(ke)}"}
        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

"""
Update Medication

medication_info:
- name
- description
- price
"""        
def update_medication(medication_id, medication_info):
    """
    Updates a medication in the database using SQLAlchemy ORM.

    :param medication_id: ID of the medication to update
    :param medication_info: Dictionary containing updated details (name, description, price)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Fetch the medication to update
            medication = session.query(models.Medication).filter_by(medication_id=medication_id).first()

            if not medication:
                return {"status": "error", "message": "Medication not found."}

            # Update the medication fields
            medication.name = medication_info['name']
            medication.description = medication_info['description']
            medication.price = medication_info['price']

            # Commit changes to the database
            session.commit()

            return {"status": "success", "message": "Medication updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in medication_info: {str(ke)}"}
        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

"""
Update Medical Condtion

medical_condition_info:
- name
- description
"""
def update_medical_condition(condition_id, condition_info):
    """
    Updates a medical condition in the database using SQLAlchemy ORM.

    :param condition_id: ID of the medical condition to update
    :param condition_info: Dictionary containing updated details (name, description)
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Fetch the medical condition to update
            condition = session.query(models.MedicalCondition).filter_by(condition_id=condition_id).first()

            if not condition:
                return {"status": "error", "message": "Medical condition does not exist."}

            # Update the condition fields
            condition.name = condition_info['name']
            condition.description = condition_info['description']

            # Commit changes to the database
            session.commit()

            return {"status": "success", "message": "Medical condition updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in condition_info: {str(ke)}"}
        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"} 
        
def reassign_appointment(appointment_id, doctor_id):
    """
    Reassign an appointment from one doctor to another available doctor.

    :param appointment_id: ID of the appointment to reassign
    :param doctor_id: Current doctor's ID
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine) 
    with Session() as session:
        try:
            # Check if the appointment exists for the given doctor
            existing_appointment = session.query(models.Appointment).filter_by(
                appointment_id=appointment_id, doctor_id_fk=doctor_id
            ).first()

            if not existing_appointment:
                return {"status": "error", "message": "Appointment does not exist for the given doctor."}

            # Find available doctors for the given date and time
            available_doctors = session.query(models.Doctor.doctor_id).outerjoin(
                models.Appointment,
                (models.Doctor.doctor_id == models.Appointment.doctor_id_fk) &
                (models.Appointment.date == existing_appointment.date) &
                (models.Appointment.time == existing_appointment.time)
            ).filter(models.Appointment.doctor_id_fk == None).all()

            if not available_doctors:
                return {"status": "error", "message": "No available doctors to reassign the appointment."}

            # Randomly select a new doctor
            new_doctor_id = random.choice([doctor.doctor_id for doctor in available_doctors])

            # Update the appointment with the new doctor
            existing_appointment.doctor_id_fk = new_doctor_id
            existing_appointment.status = 'pending'

            session.commit()

            return {
                "status": "success",
                "message": f"Appointment reassigned from doctor ID {doctor_id} to doctor ID {new_doctor_id}."
            }

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}