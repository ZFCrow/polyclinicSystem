from db_connection import get_db_connection, close_db_connection
import pymysql.cursors 
import random

def delete_user(dbConnection, user_id):
    if dbConnection: 
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if user exists and retrieve role_id
                check_user_query = """
                SELECT user_id, role_id_fk FROM user WHERE user_id = %s
                """
                cursor.execute(check_user_query, (user_id,))
                existing_user = cursor.fetchone()

                if not existing_user:
                    return {"status": "error", "message": "User does not exist."}

                user_delete_query = """
                DELETE FROM user WHERE user_id = %s
                """
                cursor.execute(user_delete_query, (user_id,))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "User and related records deleted successfully."}
        
        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
        
    else:
        return {"status": "error", "message": "No database connection established."}

def delete_diagnosis(dbConnection, diagnosis_id):
    if dbConnection:
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if diagnosis exists
                check_diagnosis_query = """
                SELECT diagnosis_id FROM diagnosis WHERE diagnosis_id = %s
                """
                cursor.execute(check_diagnosis_query, (diagnosis_id,))
                existing_diagnosis = cursor.fetchone()

                if not existing_diagnosis:
                    return {"status": "error", "message": "Diagnosis record does not exist."}

                # Proceed with the deletion of the diagnosis record
                delete_diagnosis_query = """
                DELETE FROM diagnosis WHERE diagnosis_id = %s
                """
                cursor.execute(delete_diagnosis_query, (diagnosis_id,))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "Diagnosis record deleted successfully."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection established."}

def delete_appointment(dbConnection, appointment_id, patient_id):
    if dbConnection:
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if appointment exists
                check_appointment_query = """
                SELECT appointment_id FROM appointment WHERE appointment_id = %s AND patient_id_fk = %s
                """
                cursor.execute(check_appointment_query, (appointment_id,patient_id))
                existing_appointment = cursor.fetchone()

                if not existing_appointment:
                    return {"status": "error", "message": "Appointment does not exist."}

                # Proceed with the deletion of the appointment
                delete_appointment_query = """
                DELETE FROM appointment WHERE appointment_id = %s AND patient_id_fk = %s
                """
                cursor.execute(delete_appointment_query, (appointment_id,patient_id))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "Appointment deleted successfully."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection established."}
    
def delete_billing(dbConnection, billing_id):
    if dbConnection:
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if billing record exists
                check_billing_query = """
                SELECT billing_id FROM billing WHERE billing_id = %s
                """
                cursor.execute(check_billing_query, (billing_id,))
                existing_billing = cursor.fetchone()

                if not existing_billing:
                    return {"status": "error", "message": "Billing record does not exist."}

                # Proceed with the deletion of the billing record
                delete_billing_query = """
                DELETE FROM billing WHERE billing_id = %s
                """
                cursor.execute(delete_billing_query, (billing_id,))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "Billing record deleted successfully."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}

    else:
        return {"status": "error", "message": "No database connection established."}
    
def delete_medication(dbConnection, medication_id):
    if dbConnection:
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if medication exists
                check_medication_query = """
                SELECT medication_id FROM medication WHERE medication_id = %s
                """
                cursor.execute(check_medication_query, (medication_id,))
                existing_medication = cursor.fetchone()

                if not existing_medication:
                    return {"status": "error", "message": "Medication does not exist."}

                # Proceed with the deletion of the medication
                delete_medication_query = """
                DELETE FROM medication WHERE medication_id = %s
                """
                cursor.execute(delete_medication_query, (medication_id,))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "Medication deleted successfully."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}

    else:
        return {"status": "error", "message": "No database connection established."}

def delete_medical_condition(dbConnection, condition_id):
    if dbConnection:
        try:
            connection = dbConnection

            # Use DictCursor to return rows as dictionaries
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if the condition exists
                check_condition_query = """
                SELECT condition_id FROM medical_condition WHERE condition_id = %s
                """
                cursor.execute(check_condition_query, (condition_id,))
                existing_condition = cursor.fetchone()

                if not existing_condition:
                    return {"status": "error", "message": "Medical condition does not exist."}

                # Proceed with the deletion of the medical condition
                delete_condition_query = """
                DELETE FROM medical_condition WHERE condition_id = %s
                """
                cursor.execute(delete_condition_query, (condition_id,))

                # Commit the changes to the database
                connection.commit()

            return {"status": "success", "message": "Medical condition deleted successfully."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}

    else:
        return {"status": "error", "message": "No database connection established."}