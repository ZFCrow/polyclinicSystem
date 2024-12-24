from db_connection import db
import pymysql.cursors # this is to fetch my data as a dictionary instead of a tuple 
from datetime import timedelta
import bcrypt
import time
import psutil
import json
from decimal import Decimal
import models
from sqlalchemy.orm import sessionmaker, joinedload
from sqlalchemy.exc import SQLAlchemyError
from models import Appointment, Patient, User  # Make sure these models are defined with relationships
from sqlalchemy import func
from sqlalchemy.sql.expression import case, text 

def get_memory_usage():
    process = psutil.Process()
    return process.memory_info().rss / (1024 ** 2)  # Convert to MB


def verify_password(plain_password, hashed_password):
    print("plain_password: ", plain_password) 
    print("hashed_password: ", hashed_password) 
    print ("plain_password.encode('utf-8'): ", plain_password.encode('utf-8')) 
    # Function to verify if the provided password matches the hashed value
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user(email, password=None):
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        print ("email retrieved from UI: ", email) 
        print ("password retrieved from UI: ", password)
        user = session.query(models.User).filter(models.User.email == email).first()

        if not user:
            return {"status": "error", "message": "User not found."}

        if password and verify_password(password, user.password_hash):
            return {"status": "success", "user": user.to_dict()}
        elif password:
            return {"status": "error", "message": "Incorrect password."}

        return {"status": "success", "user": user.to_dict()}

def get_appointments_by_user(user_id=None, user_role=None):
    """
    Retrieve appointments based on user ID and role 

    :param user_id: ID of the user (doctor or patient)
    :param user_role: Role of the user (1 for doctor, 2 for patient)
    :return: Dictionary with status and list of appointments or error message
    """
    if not user_role or user_role not in [1, 2]:
        return {"status": "error", "message": "Invalid user type"}

    Session = sessionmaker(bind=db.engine)  
    with Session() as session:
        try:
            # Determine the filter based on user_role
            if user_role == 2:  # Patient
                appointments = session.query(models.Appointment).filter_by(patient_id_fk=user_id).all()
            elif user_role == 1:  # Doctor
                appointments = session.query(models.Appointment).filter_by(doctor_id_fk=user_id).all()

            # Convert each appointment object to a dictionary
            #appointments_list = [appointment.to_dict() for appointment in appointments]
            
            results = []
            for appointment in appointments:
                appointment_data = {
                    "appointment_id": appointment.appointment_id,
                    "patient_id": appointment.patient.patient_id,
                    "doctor_id": appointment.doctor.doctor_id,
                    "date": str(appointment.date),  # Convert date to string if necessary
                    "time": appointment.time.strftime("%H:%M:%S"),  # Convert time to string
                    "type": appointment.type,
                    "status": appointment.status,
                }
                results.append(appointment_data)

            return {"status": "success", "appointments": results}

            #return {"status": "success", "appointments": appointments_list}

        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}


def get_medical_conditions():
    """
    Retrieve all medical conditions from the database using SQLAlchemy with session handling.

    :return: List of medical conditions as dictionaries or error message
    """
    Session = sessionmaker(bind=db.engine)  
    with Session() as session: 
        try:
            medical_conditions = session.query(models.MedicalCondition).all()
            
            # Fetch results as a list of dictionaries
            results = [condition.to_dict() for condition in medical_conditions]  
            
            return results

        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}


def get_medications():
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            medications = session.query(models.Medication).all() 
            # Convert ORM objects to dictionaries and handle Decimal conversion for JSON compatibility
            result = []
            for med in medications:
                med_dict = med.to_dict()
                # Convert `Decimal` fields to `float` if necessary
                if isinstance(med_dict.get('price'), Decimal):
                    med_dict['price'] = float(med_dict['price'])
                result.append(med_dict)
                
            return result
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}

def get_billing_by_user(patient_id=None, analysis_mode=False):
    """
    Retrieves billing records for a specific patient using SQLAlchemy ORM with optional analysis mode.

    :param patient_id: ID of the patient
    :param analysis_mode: Boolean indicating whether to return query performance metrics
    :return: Dictionary with status, billing data, and optional performance metrics
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Initialize variables for analysis mode metrics
            memory_before = exec_start_time = exec_time = fetch_time = memory_used = explain_result = show_index_result = None

            # Define the main query
            billing_query = (
                session.query(
                    models.Billing.billing_id,
                    models.Billing.appointment_id_fk,
                    models.Billing.amount_due,
                    models.Billing.amount_paid,
                    models.Billing.payment_status,
                    models.Billing.payment_method,
                    case(
                        (models.Billing.payment_status == 'paid', 'history'),
                        (models.Billing.payment_status == 'pending', 'current'),
                        else_='unknown'
                    ).label("billing_category")
                )
                .filter(models.Billing.patient_id_fk == patient_id)
                .order_by(text("billing_category"))
            )

            # Analysis mode: Explain query plan and show indexes
            if analysis_mode:
                explain_query = billing_query.statement.compile(compile_kwargs={"literal_binds": True}).string
                explain_result = session.execute(text(f"EXPLAIN ANALYZE {explain_query}")).fetchall()

                show_index_query = "SHOW INDEX FROM billing"
                show_index_result = session.execute(text(show_index_query)).fetchall()

                # Track memory usage and execution time
                memory_before = get_memory_usage()
                exec_start_time = time.time()

            # Execute the main query
            billing_records = billing_query.all()

            if analysis_mode:
                exec_time = time.time() - exec_start_time  # Query execution time

            # Separate current and history billing records
            current_billing = [
                {
                    "billing_id": record.billing_id,
                    "appointment_id_fk": record.appointment_id_fk,
                    "amount_due": record.amount_due,
                    "amount_paid": record.amount_paid,
                    "payment_status": record.payment_status,
                    "payment_method": record.payment_method,
                    "billing_category": record.billing_category,
                }
                for record in billing_records if record.billing_category == 'current'
            ]

            history_billing = [
                {
                    "billing_id": record.billing_id,
                    "appointment_id_fk": record.appointment_id_fk,
                    "amount_due": record.amount_due,
                    "amount_paid": record.amount_paid,
                    "payment_status": record.payment_status,
                    "payment_method": record.payment_method,
                    "billing_category": record.billing_category,
                }
                for record in billing_records if record.billing_category == 'history'
            ]

            # Analysis mode: Capture additional metrics
            if analysis_mode:
                memory_after = get_memory_usage()
                memory_used = memory_after - memory_before
                fetch_time = time.time() - exec_start_time
                total_time = exec_time + fetch_time

                return {
                    "status": "success",
                    "current": current_billing,
                    "history": history_billing,
                    "explain_result": [dict(row) for row in explain_result],
                    "show_index_result": [dict(row) for row in show_index_result],
                    "memory_used_MB": memory_used,
                    "query_exec_time_seconds": exec_time,
                    "fetch_time_seconds": fetch_time,
                    "total_time_seconds": total_time,
                }

            return {"status": "success", "current": current_billing, "history": history_billing}

        except SQLAlchemyError as e:
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}



def get_medication_by_user(user_id=None):
    """
    Retrieves medications for a user using SQLAlchemy ORM.

    :param user_id: ID of the user
    :return: Dictionary with status and list of medications or error message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Query to fetch medications associated with the user
            medications = (
                session.query(
                    models.Medication.medication_id,
                    models.Medication.name.label('medication_name'),
                    models.Medication.description,
                    models.Medication.price,
                    models.PatientMedication.dosage,
                    models.PatientMedication.frequency,
                    models.PatientMedication.duration
                )
                .join(models.PatientMedication, models.PatientMedication.medication_id_fk == models.Medication.medication_id)
                .join(models.Patient, models.Patient.patient_id == models.PatientMedication.patient_id_fk)
                .filter(models.Patient.user_id_fk == user_id)
                .all()
            )

            # Convert query result to a list of dictionaries
            medications_list = [
                {
                    "medication_id": med.medication_id,
                    "medication_name": med.medication_name,
                    "description": med.description,
                    "price": med.price,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "duration": med.duration,
                }
                for med in medications
            ]

            return {"status": "success", "medications": medications_list}

        except SQLAlchemyError as e:
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}



def get_appointments_by_doctor(doctor_id):
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        try:
            # Query the Appointment model and join related tables (Patient and User)
            appointments = (
                session.query(Appointment)
                .join(Patient, Appointment.patient_id_fk == Patient.patient_id)
                .join(User, Patient.user_id_fk == User.user_id)
                .options(joinedload(Appointment.patient).joinedload(Patient.user))
                .filter(Appointment.doctor_id_fk == doctor_id)
                .all()
            )

            # Process results into a dictionary format with JSON serializable values
            results = []
            for appointment in appointments:
                appointment_data = {
                    "appointment_id": appointment.appointment_id,
                    "date": str(appointment.date),  # Convert date to string if necessary
                    "time": appointment.time.strftime("%H:%M:%S"),  # Convert time to string
                    "type": appointment.type,
                    "status": appointment.status,
                    "patient_id": appointment.patient.patient_id,
                    "patient_first_name": appointment.patient.user.first_name,
                    "patient_last_name": appointment.patient.user.last_name,
                    "age": appointment.patient.age,
                    "gender": appointment.patient.gender,
                    "phone_number": appointment.patient.phone_number,
                    "patient_email": appointment.patient.user.email,
                }
                results.append(appointment_data)

            return {"status": "success", "appointments": results}

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}




def get_id_by_user(user_id=None, role=None):
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        # Step 1: Determine the role if not provided
        if role is None:
            user = session.query(models.User).filter_by(user_id=user_id).first()
            if not user:
                return {"status": "error", "message": "User not found"}
            role = user.role_id_fk

        # Step 2: Fetch the ID based on the role
        if role == 1:  # Role 1: Doctor
            doctor = session.query(models.Doctor).filter_by(user_id_fk=user_id).first()
            if doctor:
                return {"status": "success", "doctor_id": doctor.doctor_id}
            else:
                return {"status": "error", "message": "Doctor not found"}

        elif role == 2:  # Role 2: Patient
            patient = session.query(models.Patient).filter_by(user_id_fk=user_id).first()
            if patient:
                return {"status": "success", "patient_id": patient.patient_id}
            else:
                return {"status": "error", "message": "Patient not found"}

        else:
            return {"status": "error", "message": "Invalid role provided"}

def get_all_users_with_details(start, limit):
    """
    Retrieves all users with their details (including role-based details) using SQLAlchemy ORM.

    :param start: Starting index for pagination
    :param limit: Number of records to fetch
    :return: Dictionary with status, total users, and user details or an error message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Count total users
            total_users = session.query(func.count(models.User.user_id)).scalar()

            # Fetch users with pagination
            users = (
                session.query(
                    models.User.user_id,
                    models.User.username,
                    models.User.email,
                    models.User.first_name,
                    models.User.last_name,
                    models.User.created_at,
                    models.User.role_id_fk.label("role_id")
                )
                .limit(limit)
                .offset(start)
                .all()
            )

            if not users:
                return {"status": "error", "message": "No users found"}

            # Process user details
            all_users_details = [{"total_users": total_users}]

            for user in users:
                user_details = {
                    "user_id": user.user_id,
                    "role_id": user.role_id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "created_at": user.created_at,
                }

                role_id = user.role_id

                if role_id == 1:  # 1 is doctor role
                    doctor_details = (
                        session.query(models.Doctor.phone_number, models.Doctor.specialty)
                        .filter(models.Doctor.user_id_fk == user.user_id)
                        .first()
                    )
                    if doctor_details:
                        user_details.update({
                            "phone_number": doctor_details.phone_number,
                            "specialty": doctor_details.specialty,
                        })
                    else:
                        user_details.update({"doctor_details": "Doctor details not found"})

                elif role_id == 2:  # 2 is patient role
                    patient_details = (
                        session.query(
                            models.Patient.age,
                            models.Patient.gender,
                            models.Patient.phone_number,
                            models.Patient.address
                        )
                        .filter(models.Patient.user_id_fk == user.user_id)
                        .first()
                    )
                    if patient_details:
                        user_details.update({
                            "age": patient_details.age,
                            "gender": patient_details.gender,
                            "phone_number": patient_details.phone_number,
                            "address": patient_details.address,
                        })
                    else:
                        user_details.update({"patient_details": "Patient details not found"})
                else:
                    user_details.update({"role": "Role not recognized"})

                all_users_details.append(user_details)

            return {"status": "success", "users": all_users_details}

        except SQLAlchemyError as e:
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}
    
def get_user_profile(user_id):
    try:
        # Create a new session
        Session = sessionmaker(bind=db.engine)
        with Session() as session:
            # Query the User model, eager-load Doctor and Patient relationships based on role
            user = session.query(User).options(
                joinedload(User.doctor),
                joinedload(User.patient)
            ).filter_by(user_id=user_id).first()

            # Check if user exists
            if not user:
                return {"status": "error", "message": "User not found."}

            # Build the basic user profile
            user_profile = {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "created_at": user.created_at,
                "role": None
            }
            # check if user has a doctor or patient role 
            # print ("user.doctor: ", user.doctor) 
            # print ("user.patient: ", user.patient)

            # Determine the role based on the associated object
            if user.doctor:
                # The user is a doctor
                user_profile["role"] = {
                    "role_name": "Doctor",
                    "phone_number": user.doctor.phone_number,
                    "specialty": user.doctor.specialty,
                    "license_number": user.doctor.license_number
                }
            elif user.patient:
                # The user is a patient
                user_profile["role"] = {
                    "role_name": "Patient",
                    "age": user.patient.age,
                    "gender": user.patient.gender,
                    "phone_number": user.patient.phone_number,
                    "address": user.patient.address
                }
            #print ("user_profile: ", user_profile) 
            return {"status": "success", "data": user_profile}

    except KeyError as e:
        return {"status": "error", "message": f"Missing key: {str(e)}"}
    except ValueError as e:
        return {"status": "error", "message": f"Invalid value: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    

def get_patient_diagnoses_with_medications_by_appointment(patient_id, appointment_id):
    """
    Retrieves diagnoses with medications for a specific patient and appointment using SQLAlchemy ORM.

    :param patient_id: ID of the patient
    :param appointment_id: ID of the appointment
    :return: Dictionary with status and data or error message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Query to fetch diagnoses for the patient and appointment
            diagnoses = (
                session.query(
                    models.Diagnosis.diagnosis_id,
                    models.Diagnosis.diagnosis_description,
                    models.Diagnosis.doctor_id_fk.label("doctor_id"),
                    models.Diagnosis.diagnosis_date,
                    models.Diagnosis.severity
                )
                .filter(
                    models.Diagnosis.patient_id_fk == patient_id,
                    models.Diagnosis.appointment_id_fk == appointment_id
                )
                .all()
            )

            diagnosis_with_medications = []
            for diagnosis in diagnoses:
                # Query medications for each diagnosis
                medications = (
                    session.query(
                        models.PatientMedication.medication_id_fk.label("medication_id"),
                        models.Medication.name,
                        models.PatientMedication.dosage,
                        models.PatientMedication.frequency,
                        models.PatientMedication.duration
                    )
                    .join(models.Medication, models.PatientMedication.medication_id_fk == models.Medication.medication_id)
                    .filter(models.PatientMedication.diagnosis_id_fk == diagnosis.diagnosis_id)
                    .all()
                )

                # Convert medications to dictionaries
                medications_list = [
                    {
                        "medication_id": med.medication_id,
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "duration": med.duration
                    }
                    for med in medications
                ]

                # Add diagnosis with medications
                diagnosis_with_medications.append({
                    "diagnosis_id": diagnosis.diagnosis_id,
                    "diagnosis_description": diagnosis.diagnosis_description,
                    "doctor_id": diagnosis.doctor_id,
                    "diagnosis_date": diagnosis.diagnosis_date,
                    "severity": diagnosis.severity,
                    "medications": medications_list
                })

            return {"status": "success", "data": diagnosis_with_medications}

        except SQLAlchemyError as e:
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}


def convert_decimal(obj):
    # Convert Decimal types to float for JSON serialization
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


if __name__ == '__main__':
    db_connection = get_db_connection()  # Correctly call the function to get a connection
    # results = get_medical_conditions(db_connection)
    # print(results)

    # get billing by user  (no analysis mode) 
    #results = get_billing_by_user(db_connection, 251) 
    #print(results) 

    # get billing by user (with analysis mode) 
    results = get_billing_by_user(db_connection, 251, analysis_mode=True) 
    print(json.dumps(results, indent=4, default=convert_decimal))




