from datetime import datetime
import bcrypt
import pymysql.cursors
import random
"""
user_info:
- username
- email
- password
- last_name
- phone_number
- address
"""
def update_user_info(dbConnection, user_id, user_info):
    if dbConnection:
        connection = dbConnection
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                role_query = """
                SELECT role_id_fk FROM user WHERE user_id = %s
                """
                cursor.execute(role_query, (user_id,))
                role_id = cursor.fetchone()['role_id_fk']

                update_fields = ['username = %s', 'email = %s', 'first_name = %s', 'last_name = %s']
                values = [user_info['username'], user_info['email'], user_info['first_name'], user_info['last_name']]

                if user_info.get('password_hash'):
                    hashed_password = bcrypt.hashpw(user_info['password_hash'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    update_fields.append('password_hash = %s')
                    values.append(hashed_password)

                values.append(user_id)

                # UPDATE user SET username = %s, password_hash = %s,email = %s, first_name = %s, last_name = %s WHERE user_id = %s
                # query below is essentially the above query, just that the columns are dynamic
                update_user_query = f"""
                UPDATE user
                SET {', '.join(update_fields)}
                WHERE user_id = %s
                """
                cursor.execute(update_user_query, tuple(values))

                if role_id == 1:  # 1 is for doctor
                    update_doctor_query = """
                    UPDATE doctor
                    SET  phone_number = %s, specialty = %s
                    WHERE user_id_fk = %s
                    """
                    cursor.execute(update_doctor_query, (user_info['phone_number'], user_info['specialty'], user_id))
                
                elif role_id == 2:  # 2 is for patient
                    update_patient_query = """
                    UPDATE patient
                    SET age = %s, phone_number = %s, address = %s
                    WHERE user_id_fk = %s
                    """
                    cursor.execute(update_patient_query, (user_info['age'], user_info['phone_number'], user_info['address'],  user_id))
                
                connection.commit()

            return {"status": "success", "message": "User information updated successfully."}
        
        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in diagnosis_info: {str(ke)}"}

        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        
        except Exception as e:
            if connection:
                connection.rollback()
            return {"status": "error", "message": f"Error occurred: {str(e)}"}

"""
appointment_info:
- date
- time
- type
"""
def update_appointment(dbConnection, patient_id, appointment_id, appointment_info):
    if dbConnection:
        connection = dbConnection
        try:
            with connection.cursor() as cursor:
                update_query = """
                UPDATE appointment
                SET date = %s, time = %s, type = %s
                WHERE appointment_id = %s AND patient_id_fk = %s
                """

                cursor.execute(update_query, (appointment_info['date'], appointment_info['time'], appointment_info['type'], appointment_id, patient_id))
                
                connection.commit()
            
            return {"status": "success", "message": "Appointment updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in diagnosis_info: {str(ke)}"}

        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        
        except Exception as e:
            if connection:
                connection.rollback()
            return {"status": "error", "message": f"Error occurred: {str(e)}"}


"""
assuming user pays full of the amount due

payment_info:
- amount_paid
- payment_method
"""
def update_billing_status(dbConnection, billing_id, appointment_id, patient_id, payment_info):
    if dbConnection:
        try:
            connection = dbConnection

            with connection.cursor() as cursor:
                update_billing_query = """
                UPDATE billing
                SET amount_paid = %s, billing_date = %s, payment_status = %s,  payment_method = %s
                WHERE billing_id = %s AND appointment_id_fk = %s AND patient_id_fk = %s
                """
                
                current_date = datetime.now().strftime('%Y-%m-%d')
                cursor.execute(update_billing_query, (payment_info['amount_paid'], current_date, 'paid', payment_info['payment_method'], billing_id, appointment_id, patient_id ))

                connection.commit()
            
            return {"status": "success", "message": "Billing status updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in diagnosis_info: {str(ke)}"}

        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        
        except Exception as e:
            if connection:
                connection.rollback()
            return {"status": "error", "message": f"Error occurred: {str(e)}"}

"""
Update Medication

medication_info:
- name
- description
- price
"""        
def update_medication(dbConnection, medication_id, medication_info):
    if dbConnection:
        try:
            connection = dbConnection

            with connection.cursor() as cursor:
                update_medication_query = """
                UPDATE medication
                SET name= %s, description = %s, price = %s
                WHERE medication_id = %s
                """

                cursor.execute(update_medication_query, (medication_info['name'],medication_info['description'], medication_info['price'], medication_id))

                connection.commit()
            
            return {"status": "success", "message": "Medication updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in medication_info: {str(ke)}"}

        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        
        except Exception as e:
            if connection:
                connection.rollback()
            return {"status": "error", "message": f"Error occurred: {str(e)}"}    

"""
Update Medical Condtion

medical_condition_info:
- name
- description
"""
def update_medical_condition(dbConnection, condition_id, condition_info):
    if dbConnection:
        try:
            connection = dbConnection

            with connection.cursor() as cursor:
                update_condition_query = """
                UPDATE medical_condition
                SET name= %s, description = %s
                WHERE condition_id = %s
                """

                cursor.execute(update_condition_query, (condition_info['name'],condition_info['description'], condition_id))

                connection.commit()
            
            return {"status": "success", "message": "Medical Condition updated successfully."}

        except KeyError as ke:
            return {"status": "error", "message": f"Missing data in condition_info: {str(ke)}"}

        except ValueError as ve:
            return {"status": "error", "message": f"Invalid data: {str(ve)}"}
        
        except Exception as e:
            if connection:
                connection.rollback()
            return {"status": "error", "message": f"Error occurred: {str(e)}"}  
        
def reassign_appointment(dbConnection, appointment_id, doctor_id):
    if dbConnection:
        try:
            connection = dbConnection

            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                check_appointment_query = """
                SELECT appointment_id, patient_id_fk, date, time
                FROM appointment 
                WHERE appointment_id = %s AND doctor_id_fk = %s
                """
                cursor.execute(check_appointment_query, (appointment_id, doctor_id))
                existing_appointment = cursor.fetchone()

                if not existing_appointment:
                    return {"status": "error", "message": "Appointment does not exist for the given doctor."}

                available_doctors_query = """
                SELECT d.doctor_id 
                FROM doctor d
                LEFT JOIN appointment a 
                ON d.doctor_id = a.doctor_id_fk AND a.date = %s AND a.time = %s
                WHERE a.doctor_id_fk IS NULL;
                """
                
                cursor.execute(available_doctors_query, (existing_appointment['date'], existing_appointment['time']))
                available_doctors = cursor.fetchall()

                if not available_doctors:
                    return {"status": "error", "message": "No available doctors to reassign the appointment."}

                new_doctor_id = random.choice(available_doctors)['doctor_id']

                update_appointment_query = """
                UPDATE appointment 
                SET doctor_id_fk = %s, status = %s
                WHERE appointment_id = %s
                """
                cursor.execute(update_appointment_query, (
                    new_doctor_id, 
                    'pending',  
                    appointment_id
                ))

                connection.commit()

            return {"status": "success", "message": f"Appointment reassigned from doctor ID {doctor_id} to doctor ID {new_doctor_id}."}

        # Error handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            # Rollback any changes if an error occurs
            connection.rollback()
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}