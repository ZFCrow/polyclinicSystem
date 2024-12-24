from db_connection import db
import pymysql.cursors 
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import models

def delete_user(user_id):
    Session = sessionmaker(bind=db.engine)
    with Session() as session:
        try:
            # Check if the user exists
            user = session.query(models.User).filter_by(user_id=user_id).first()
            if not user:
                return {"status": "error", "message": "User does not exist."}
            
            # Delete the user
            session.delete(user)
            session.commit()

            return {"status": "success", "message": "User and related records deleted successfully."}
        
        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

def delete_diagnosis(diagnosis_id):
    """
    Deletes a diagnosis record from the database using SQLAlchemy ORM.

    :param diagnosis_id: ID of the diagnosis record to delete
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Check if the diagnosis record exists
            diagnosis = session.query(models.Diagnosis).filter_by(diagnosis_id=diagnosis_id).first()

            if not diagnosis:
                return {"status": "error", "message": "Diagnosis record does not exist."}

            # Proceed with the deletion of the diagnosis record
            session.delete(diagnosis)
            session.commit()

            return {"status": "success", "message": "Diagnosis record deleted successfully."}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

def delete_appointment(appointment_id, patient_id):
    """
    Deletes an appointment from the database using SQLAlchemy ORM.

    :param appointment_id: ID of the appointment to delete
    :param patient_id: ID of the patient associated with the appointment
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Check if the appointment exists
            appointment = session.query(models.Appointment).filter_by(
                appointment_id=appointment_id,
                patient_id_fk=patient_id
            ).first()

            if not appointment:
                return {"status": "error", "message": "Appointment does not exist."}

            # Delete the appointment
            session.delete(appointment)
            session.commit()

            return {"status": "success", "message": "Appointment deleted successfully."}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}
    
def delete_billing(billing_id):
    """
    Deletes a billing record from the database using SQLAlchemy ORM.

    :param billing_id: ID of the billing record to delete
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Check if the billing record exists
            billing_record = session.query(models.Billing).filter_by(billing_id=billing_id).first()

            if not billing_record:
                return {"status": "error", "message": "Billing record does not exist."}

            # Proceed with the deletion of the billing record
            session.delete(billing_record)
            session.commit()

            return {"status": "success", "message": "Billing record deleted successfully."}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}
    
def delete_medication(medication_id):
    """
    Deletes a medication record from the database using SQLAlchemy ORM.

    :param medication_id: ID of the medication to delete
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Check if the medication exists
            medication = session.query(models.Medication).filter_by(medication_id=medication_id).first()

            if not medication:
                return {"status": "error", "message": "Medication does not exist."}

            # Proceed with the deletion of the medication
            session.delete(medication)
            session.commit()

            return {"status": "success", "message": "Medication deleted successfully."}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}

def delete_medical_condition(condition_id):
    """
    Deletes a medical condition from the database using SQLAlchemy ORM.

    :param condition_id: ID of the medical condition to delete
    :return: Dictionary with status and message
    """
    Session = sessionmaker(bind=db.engine)  # Assuming `db.engine` is your SQLAlchemy engine
    with Session() as session:
        try:
            # Check if the medical condition exists
            condition = session.query(models.MedicalCondition).filter_by(condition_id=condition_id).first()

            if not condition:
                return {"status": "error", "message": "Medical condition does not exist."}

            # Proceed with the deletion of the medical condition
            session.delete(condition)
            session.commit()

            return {"status": "success", "message": "Medical condition deleted successfully."}

        except SQLAlchemyError as e:
            session.rollback()
            return {"status": "error", "message": f"Database error occurred: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error occurred: {str(e)}"}