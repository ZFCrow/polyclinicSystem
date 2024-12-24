from db_connection import get_db_connection, close_db_connection
import pymysql.cursors # this is to fetch my data as a dictionary instead of a tuple 
from datetime import timedelta
import bcrypt
import time
import psutil
import json
from decimal import Decimal
from datetime import date

def get_memory_usage():
    process = psutil.Process()
    return process.memory_info().rss / (1024 ** 2)  # Convert to MB


def verify_password(plain_password, hashed_password):
    # Function to verify if the provided password matches the hashed value
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user(dbConnection=None, email=None, password=None, analysis_mode=False): 
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                query_template = """
                SELECT * FROM user WHERE email = %s
                """
                analysis_metrics = []  # Initialize analysis metrics list 
                scenarios = [
                    {"name": "normal", "query": query_template}
                ]

                if analysis_mode: 
                    scenarios.append({"name": "ignore_index", "query": query_template.replace("FROM user", "FROM user IGNORE INDEX (email)")}) 
                
                for scenario in scenarios:
                    metrics = {"scenario": scenario["name"]} 
                    if analysis_mode: 
                        memory_before = get_memory_usage() 
                        exec_start_time = time.time()


                    cursor.execute(scenario["query"], (email,))

                    if analysis_mode: 
                        metrics["query_exec_time_seconds"] = time.time() - exec_start_time
                        fetch_start_time = time.time() 

                    user = cursor.fetchone()

                    if analysis_mode: 
                        metrics["fetch_time_seconds"] = time.time() - fetch_start_time
                        metrics["memory_used_MB"] = get_memory_usage() - memory_before
                        metrics["result_count"] = 1 if user else 0 
                        cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}", (email,)) 
                        explain_result = cursor.fetchall() 
                        metrics["EXPLAIN_ANALYSIS_result"] = explain_result 
                        analysis_metrics.append(metrics) 

                if not user:
                    result =  {"status": "error", "message": "User not found."}
                
                if password:
                    stored_hashed_password = user['password_hash'] 
                    if verify_password(password, stored_hashed_password):
                        
                        result = {"status": "success", "user": user}
                    else:
                        result = {"status": "error", "message": "Incorrect password."}
                
                if analysis_mode:
                    result["analysis"] = analysis_metrics 
                
                return result 
            
        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}

def get_appointments_by_user(dbConnection=None, user_id=None, user_role=None, analysis_mode=False):
    if not dbConnection:
        return {"status": "error", "message": "No database connection provided"}

    try:
        # Initialize variables
        analysis_metrics = []
        query_template_patient = """
            SELECT * FROM appointment WHERE patient_id_fk = %s
        """
        query_template_doctor = """
            SELECT * FROM appointment WHERE doctor_id_fk = %s
        """

        # Determine the query based on the user role
        if user_role == 2:  # Patient
            query_template = query_template_patient
        elif user_role == 1:  # Doctor
            query_template = query_template_doctor
        else:
            raise ValueError("Invalid user role")

        # If analysis_mode is True, define scenarios; otherwise, use a single query
        scenarios = [
            {"name": "normal", "query": query_template}
        ]

        if analysis_mode:
            scenarios.append(
                {"name": "ignore_index", "query": query_template.replace("FROM appointment", "FROM appointment IGNORE INDEX (PRIMARY, idx_appointment_doctor_patient, patient_id_fk, doctor_id_fk)")} 
            )

        with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
            appointments = []

            for scenario in scenarios:
                metrics = {"scenario": scenario["name"]}

                if analysis_mode:
                    # Start tracking memory and execution time
                    memory_before = get_memory_usage()
                    exec_start_time = time.time()

                # Execute the query
                cursor.execute(scenario["query"], (user_id,))

                if analysis_mode:
                    # Capture execution and fetch times
                    metrics["query_exec_time_seconds"] = time.time() - exec_start_time
                    fetch_start_time = time.time()
                
                # Fetch the appointments
                scenario_appointments = cursor.fetchall()

                if analysis_mode:
                    metrics["fetch_time_seconds"] = time.time() - fetch_start_time
                    metrics["memory_used_MB"] = get_memory_usage() - memory_before
                    metrics["result_count"] = len(scenario_appointments)  # Add result size for analysis
                    # explain analyze for the query 
                    cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}", (user_id,)) 
                    explain_result = cursor.fetchall() 
                    metrics["EXPLAIN_ANALYSIS_result"] = explain_result 

                # Save metrics for this scenario if analysis_mode is True
                if analysis_mode:
                    analysis_metrics.append(metrics)

                # Append appointments only once (in non-analysis mode, this loop runs once)
                # appointments.extend(scenario_appointments)
                appointments = scenario_appointments # Return only the last scenario's results 

        # Process appointments to convert `timedelta` to string
        for appointment in appointments:
            for key, value in appointment.items():
                if isinstance(value, timedelta):
                    appointment[key] = str(value)  # Convert timedelta to string

        # Return results with or without analysis metrics
        result = {"status": "success", "appointments": appointments}
        if analysis_mode:
            result["analysis"] = analysis_metrics
        return result

    except KeyError as e:
        return {"status": "error", "message": f"Missing key: {str(e)}"}
    except ValueError as e:
        return {"status": "error", "message": f"Invalid value: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Error has occurred: {str(e)}"}



def get_medical_conditions(dbConnection=None, analysis_mode=False):
    if dbConnection:
        try:
            query = "SELECT * FROM medical_condition"
            scenarios = [{"name": "normal", "query": query}]
            analysis_metrics = []  # Initialize analysis metrics list
            medical_conditions = []  # Placeholder for the result

            # Add an ignore index scenario if analysis_mode is enabled
            if analysis_mode:
                scenarios.append({
                    "name": "ignore_index",
                    "query": query.replace("FROM medical_condition", "FROM medical_condition IGNORE INDEX(primary_index_name)")  # Replace `primary_index_name` with the actual index name if applicable
                })

            for scenario in scenarios:
                metrics = {"scenario": scenario["name"]}

                # Track performance metrics
                if analysis_mode:
                    memory_before = get_memory_usage()
                    exec_start_time = time.time()

                # Execute the query
                with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                    cursor.execute(scenario["query"])
                    exec_time = time.time() - exec_start_time if analysis_mode else None

                    if analysis_mode:
                        fetch_start_time = time.time()

                    # Fetch results
                    scenario_conditions = cursor.fetchall()
                    fetch_time = time.time() - fetch_start_time if analysis_mode else None

                if analysis_mode:
                    memory_after = get_memory_usage()
                    memory_used = memory_after - memory_before

                    # Run EXPLAIN ANALYZE for query details
                    try:
                        cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}")
                        explain_result = cursor.fetchall()
                        metrics["EXPLAIN_ANALYSIS_result"] = explain_result
                    except Exception as e:
                        metrics["EXPLAIN_ANALYSIS_error"] = str(e)

                    # Collect metrics for the scenario
                    metrics["query_exec_time_seconds"] = exec_time
                    metrics["fetch_time_seconds"] = fetch_time
                    metrics["memory_used_MB"] = memory_used
                    metrics["result_count"] = len(scenario_conditions)
                    analysis_metrics.append(metrics)

                # Save the medical conditions for the last scenario
                medical_conditions = scenario_conditions

            # Return the response
            result = {
                "status": "success",
                "medical_conditions": medical_conditions if not analysis_mode else None  # Return data only if analysis_mode is False
            }
            if analysis_mode:
                result["analysis"] = analysis_metrics
            return result

        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}



def get_medications(dbConnection=None, analysis_mode=False):
    if dbConnection:
        try:
            query = "SELECT * FROM medication"
            scenarios = [{"name": "normal", "query": query}]
            analysis_metrics = []  # Initialize analysis metrics list
            medications = []  # Placeholder for the results

            # Add an ignore index scenario if analysis_mode is enabled
            if analysis_mode:
                scenarios.append({
                    "name": "ignore_index",
                    "query": query.replace("FROM medication", "FROM medication IGNORE INDEX(primary_index_name)")  # Replace `primary_index_name` with the actual index name if applicable
                })

            for scenario in scenarios:
                metrics = {"scenario": scenario["name"]}

                # Record performance metrics if analysis_mode is enabled
                if analysis_mode:
                    memory_before = get_memory_usage()
                    exec_start_time = time.time()

                # Execute the query
                with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                    cursor.execute(scenario["query"])
                    exec_time = time.time() - exec_start_time if analysis_mode else None

                    if analysis_mode:
                        fetch_start_time = time.time()

                    # Fetch results
                    scenario_medications = cursor.fetchall()
                    fetch_time = time.time() - fetch_start_time if analysis_mode else None

                if analysis_mode:
                    memory_after = get_memory_usage()
                    memory_used = memory_after - memory_before

                    # Run EXPLAIN ANALYZE for query details
                    try:
                        cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}")
                        explain_result = cursor.fetchall()
                        metrics["EXPLAIN_ANALYSIS_result"] = explain_result
                    except Exception as e:
                        metrics["EXPLAIN_ANALYSIS_error"] = str(e)

                    # Collect metrics for the scenario
                    metrics["query_exec_time_seconds"] = exec_time
                    metrics["fetch_time_seconds"] = fetch_time
                    metrics["memory_used_MB"] = memory_used
                    metrics["result_count"] = len(scenario_medications)
                    analysis_metrics.append(metrics)

                # Save the medications from the last scenario
                medications = scenario_medications

            # Return the response
            result = {
                "status": "success",
                "medications": medications if not analysis_mode else None  # Return data only if analysis_mode is False
            }
            if analysis_mode:
                result["analysis"] = analysis_metrics
            return result

        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}






def get_billing_by_user(dbConnection=None, user_id=None, analysis_mode=False):
    if not dbConnection:
        return {"status": "error", "message": "No database connection provided"}

    try:
        # Initialize variables
        analysis_metrics = []
        query_template = """
            SELECT 
                b.billing_id, 
                b.appointment_id_fk, 
                b.amount_due, 
                b.amount_paid, 
                b.payment_status, 
                b.payment_method, 
                CASE 
                    WHEN b.payment_status = 'paid' THEN 'history'
                    WHEN b.payment_status = 'pending' THEN 'current'
                    ELSE 'unknown'
                END AS billing_category
            FROM billing b
            JOIN patient p ON b.patient_id_fk = p.patient_id
            WHERE p.patient_id = %s
            ORDER BY billing_category;
        """

        # Queries to execute (normal and with ignored indexes)
        scenarios = [
            {"name": "normal", "query": query_template},  # Normal query
            {"name": "ignore_index", "query": query_template.replace("FROM billing b", "FROM billing b IGNORE INDEX (PRIMARY)")}
        ]

        with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
            for scenario in scenarios:
                metrics = {"scenario": scenario["name"]}

                if analysis_mode:
                    # Start tracking memory and execution time
                    memory_before = get_memory_usage()
                    exec_start_time = time.time()

                # Execute the query
                cursor.execute(scenario["query"], (user_id,))

                if analysis_mode:
                    # Capture execution and fetch times
                    metrics["query_exec_time_seconds"] = time.time() - exec_start_time

                    fetch_start_time = time.time()
                
                # Fetch the billing records
                billing_records = cursor.fetchall()

                if analysis_mode:
                    metrics["fetch_time_seconds"] = time.time() - fetch_start_time
                    metrics["memory_used_MB"] = get_memory_usage() - memory_before
                    metrics["result_count"] = len(billing_records)  # Add result size for analysis
                    # EXPLAIN ANALYZE for the query 
                    cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}", (user_id,)) 
                    explain_result = cursor.fetchall() 
                    metrics["EXPLAIN_ANALYSIS_result"] = explain_result 

                # Save metrics for this scenario
                analysis_metrics.append(metrics)

        # Separate current and history billing records
        current_billing = [record for record in billing_records if record["billing_category"] == "current"]
        history_billing = [record for record in billing_records if record["billing_category"] == "history"]

        # Return results with or without analysis metrics
        result = {"status": "success", "current": current_billing, "history": history_billing}
        if analysis_mode:
            result["analysis"] = analysis_metrics
        return result

    except KeyError as e:
        return {"status": "error", "message": f"Missing key: {str(e)}"}
    except ValueError as e:
        return {"status": "error", "message": f"Invalid value: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Error has occurred: {str(e)}"}




def get_medication_by_user(dbConnection=None, user_id=None, analysis_mode=False):
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                query = """
                SELECT 
                    m.medication_id, 
                    m.name AS medication_name, 
                    m.description, 
                    m.price, 
                    pm.dosage, 
                    pm.frequency, 
                    pm.duration
                FROM patient_medication pm
                JOIN patient p ON pm.patient_id_fk = p.patient_id
                JOIN medication m ON pm.medication_id_fk = m.medication_id
                WHERE p.user_id_fk = %s;
                """
                scenarios = [{"name": "normal", "query": query}]

                # Add an ignore index scenario if analysis_mode is enabled
                if analysis_mode:
                    scenarios.append({
                        "name": "ignore_index",
                        "query": query.replace("FROM patient_medication pm", "FROM patient_medication pm IGNORE INDEX(patient_id_fk)")
                    })

                analysis_metrics = []  # Initialize metrics list
                medications = []       # Placeholder for results
                for scenario in scenarios:
                    metrics = {"scenario": scenario["name"]}

                    # Record performance metrics if analysis_mode is enabled
                    if analysis_mode:
                        memory_before = get_memory_usage()
                        exec_start_time = time.time()

                    # Execute the query
                    cursor.execute(scenario["query"], (user_id,))

                    if analysis_mode:
                        metrics["query_exec_time_seconds"] = time.time() - exec_start_time
                        fetch_start_time = time.time()

                    # Fetch the result
                    scenario_medications = cursor.fetchall()

                    if analysis_mode:
                        metrics["fetch_time_seconds"] = time.time() - fetch_start_time
                        metrics["memory_used_MB"] = get_memory_usage() - memory_before
                        metrics["result_count"] = len(scenario_medications)

                        # Run EXPLAIN ANALYSIS to gather query execution details
                        try:
                            cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}", (user_id,))
                            explain_result = cursor.fetchall()
                            metrics["EXPLAIN_ANALYSIS_result"] = explain_result
                        except Exception as e:
                            metrics["EXPLAIN_ANALYSIS_error"] = str(e)

                        # Append analysis metrics
                        analysis_metrics.append(metrics)

                    # Save the medications from the last scenario
                    medications = scenario_medications

                # Return results
                result = {"status": "success", "medications": medications}
                if analysis_mode:
                    result["analysis"] = analysis_metrics
                return result

        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}

def get_appointments_by_doctor(dbConnection=None, doctor_id=None, analysis_mode=False):
    if not dbConnection:
        return {"status": "error", "message": "No database connection provided"}

    if not doctor_id:
        return {"status": "error", "message": "Doctor ID is required"}

    try:
        with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
            # Query to fetch appointments and associated patient details
            query = """
            SELECT 
                a.appointment_id, 
                a.date, 
                a.time, 
                a.type, 
                a.status, 
                p.patient_id, 
                u.first_name AS patient_first_name, 
                u.last_name AS patient_last_name, 
                p.age, 
                p.gender, 
                p.phone_number, 
                u.email AS patient_email
            FROM appointment a
            JOIN patient p ON a.patient_id_fk = p.patient_id
            JOIN user u ON p.user_id_fk = u.user_id
            WHERE a.doctor_id_fk = %s
            """

            query_ignore_index = query.replace(
                "FROM appointment a",
                "FROM appointment a IGNORE INDEX (PRIMARY, doctor_id_fk, patient_id_fk, idx_appointment_doctor_patient)"
            ).replace(
                "JOIN patient p ON a.patient_id_fk = p.patient_id",
                "JOIN patient p IGNORE INDEX (PRIMARY, user_id_fk) ON a.patient_id_fk = p.patient_id"
            ).replace(
                "JOIN user u ON p.user_id_fk = u.user_id",
                "JOIN user u IGNORE INDEX (PRIMARY, email) ON p.user_id_fk = u.user_id"
            )

            analysis_metrics = []
            appointments = []
            # show the index from all 3 tables 
            for table in ['appointment','patient','user']: 
                cursor.execute(f"SHOW INDEX FROM {table}") 
                index_result = cursor.fetchall() 
                analysis_metrics.append({f"{table}_index": index_result}) 
                
            # Define scenarios for analysis mode
            scenarios = [{"name": "normal", "query": query}]
            if analysis_mode:
                scenarios.append({"name": "ignore_index", "query": query_ignore_index})

            for scenario in scenarios:
                metrics = {"scenario": scenario["name"]}
                if analysis_mode:
                    # Start tracking memory usage and execution time
                    memory_before = get_memory_usage()
                    exec_start_time = time.time()

                # Execute the query
                cursor.execute(scenario["query"], (doctor_id,))
                scenario_appointments = cursor.fetchall()

                if analysis_mode:
                    # Capture query execution and fetch times
                    metrics["query_exec_time_seconds"] = time.time() - exec_start_time
                    fetch_start_time = time.time()
                    metrics["fetch_time_seconds"] = time.time() - fetch_start_time
                    metrics["memory_used_MB"] = get_memory_usage() - memory_before
                    metrics["result_count"] = len(scenario_appointments)

                    # Run EXPLAIN ANALYZE for query
                    cursor.execute(f"EXPLAIN ANALYZE {scenario['query']}", (doctor_id,))
                    metrics["EXPLAIN_ANALYSIS_result"] = cursor.fetchall()

                # Add analysis metrics for the scenario
                if analysis_mode:
                    analysis_metrics.append(metrics)

                # Save appointments for the last executed query
                appointments = scenario_appointments

            if not appointments:
                return {"status": "error", "message": "No appointments found for the specified doctor"}

            # Process appointments to format specific fields
            for appointment in appointments:
                for key, value in appointment.items():
                    # Convert timedelta to string if any timedelta fields exist
                    if isinstance(value, timedelta):
                        appointment[key] = str(value)
                    # Convert date to ISO format
                    elif isinstance(value, date):
                        appointment[key] = value.isoformat()

            result = {"status": "success"}
            if analysis_mode:
                result["analysis"] = analysis_metrics
            else: 
                result["appointments"] = appointments
                
            return result

    except pymysql.MySQLError as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}




def get_id_by_user(dbConnection=None, user_id=None, role=None):
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:

                # Step 1: Determine the role
                if role is None:
                    # Fetch the user's role from the database
                    query = """
                    SELECT role FROM user WHERE user_id = %s
                    """
                    cursor.execute(query, (user_id,))
                    result = cursor.fetchone()
                    
                    if not result:
                        return {"status": "error", "message": "User not found"}
                    
                    role = result['role']
                else:
                    # Validate the provided role
                    if role not in [1, 2]:
                        return {"status": "error", "message": "Invalid role provided"}

                # Step 2: Fetch the ID based on the role
                if role == 1:
                    # Role 1: Fetch from doctor table
                    query = """
                    SELECT doctor_id FROM doctor WHERE user_id_fk = %s
                    """
                    cursor.execute(query, (user_id,))
                    doctor = cursor.fetchone()
                    
                    if doctor:
                        doctor_id = doctor['doctor_id']
                        return {"status": "success", "doctor_id": doctor_id}
                    else:
                        return {"status": "error", "message": "Doctor not found"}

                elif role == 2:
                    # Role 2: Fetch from patient table
                    query = """
                    SELECT patient_id FROM patient WHERE user_id_fk = %s
                    """
                    cursor.execute(query, (user_id,))
                    patient = cursor.fetchone()
                    
                    if patient:
                        patient_id = patient['patient_id']
                        return {"status": "success", "patient_id": patient_id}
                    else:
                        return {"status": "error", "message": "Patient not found"}
        
        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"An error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}

def get_all_users_with_details(dbConnection, start, limit):
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                count_query = "SELECT COUNT(*) AS total_users FROM user;"
                cursor.execute(count_query)
                total_users = cursor.fetchone()['total_users']

                # select from user table with pagination
                query = """
                SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, u.created_at, r.role_id
                FROM user u
                JOIN role r ON u.role_id_fk = r.role_id
                LIMIT %s OFFSET %s;
                """
                cursor.execute(query, (limit, start))
                users = cursor.fetchall()
                
                if not users:
                    return {"status": "error", "message": "No users found"}

                # Process user details
                all_users_details = []
                all_users_details.append({"total_users": total_users})

                for user in users:
                    user_details = dict(user) 

                    role_id = user['role_id']

                    if role_id == 1:  # 1 is doctor role
                        doctor_query = """
                        SELECT d.phone_number, d.specialty
                        FROM doctor d
                        WHERE d.user_id_fk = %s;
                        """
                        cursor.execute(doctor_query, (user['user_id'],))
                        doctor_details = cursor.fetchone()
                        
                        if doctor_details:
                            user_details.update(doctor_details)
                        else:
                            user_details.update({"doctor_details": "Doctor details not found"})

                    elif role_id == 2:  # 2 is patient role
                        patient_query = """
                        SELECT p.age, p.gender, p.phone_number, p.address
                        FROM patient p
                        WHERE p.user_id_fk = %s;
                        """
                        cursor.execute(patient_query, (user['user_id'],))
                        patient_details = cursor.fetchone()
                        
                        if patient_details:
                            user_details.update(patient_details)
                        else:
                            user_details.update({"patient_details": "Patient details not found"})
                    
                    else:
                        user_details.update({"role": "Role not recognized"})

                    all_users_details.append(user_details)

                return {"status": "success", "users": all_users_details}
            
        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}
    
def get_user_profile(dbConnection, user_id):
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                user_query = """
                SELECT u.user_id, u.role_id_fk, u.username, u.email, u.first_name, u.last_name, u.created_at
                FROM user u
                WHERE u.user_id = %s
                """
                cursor.execute(user_query, (user_id,))
                user_info = cursor.fetchone()

                if not user_info:
                    return {"status": "error", "message": "User not found."}

                user_profile = {
                    "user_id": user_info['user_id'],
                    "username": user_info['username'],
                    "email": user_info['email'],
                    "first_name": user_info['first_name'],
                    "last_name": user_info['last_name'],
                    "created_at": user_info['created_at'],
                    "role": None
                }

                role_id = user_info['role_id_fk']

                if role_id == 1:  # doctor role
                    doctor_query = """
                    SELECT d.phone_number, d.specialty, d.license_number
                    FROM doctor d
                    WHERE d.user_id_fk = %s
                    """
                    cursor.execute(doctor_query, (user_id,))
                    doctor_info = cursor.fetchone()

                    if doctor_info:
                        user_profile["role"] = {
                            "role_name": "Doctor",
                            "phone_number": doctor_info['phone_number'],
                            "specialty": doctor_info['specialty'],
                            "license_number": doctor_info['license_number']
                        }

                elif role_id == 2:  # patient role
                    patient_query = """
                    SELECT p.age, p.gender, p.phone_number, p.address
                    FROM patient p
                    WHERE p.user_id_fk = %s
                    """
                    cursor.execute(patient_query, (user_id,))
                    patient_info = cursor.fetchone()

                    if patient_info:
                        user_profile["role"] = {
                            "role_name": "Patient",
                            "age": patient_info['age'],
                            "gender": patient_info['gender'],
                            "phone_number": patient_info['phone_number'],
                            "address": patient_info['address']
                        }

                return {"status": "success", "data": user_profile}

        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}
    

def get_patient_diagnoses_with_medications_by_appointment(dbConnection, patient_id, appointment_id):
    if dbConnection:
        try:
            with dbConnection.cursor(pymysql.cursors.DictCursor) as cursor:
                diagnosis_query = """
                SELECT diagnosis_id, diagnosis_description, doctor_id_fk, diagnosis_date, severity
                FROM diagnosis
                WHERE patient_id_fk = %s AND appointment_id_fk = %s
                """
                cursor.execute(diagnosis_query, (patient_id, appointment_id))
                diagnoses = cursor.fetchall()

                diagnosis_with_medications = []
                for diagnosis in diagnoses:
                    diagnosis_id = diagnosis['diagnosis_id']
                    
                    medication_query = """
                    SELECT pm.medication_id_fk, m.name, pm.dosage, pm.frequency, pm.duration
                    FROM patient_medication pm
                    JOIN medication m ON pm.medication_id_fk = m.medication_id
                    WHERE pm.diagnosis_id_fk = %s
                    """
                    cursor.execute(medication_query, (diagnosis_id,))
                    medications = cursor.fetchall()
                    
                    diagnosis_with_medications.append({
                        'diagnosis_id': diagnosis_id,
                        'diagnosis_description': diagnosis['diagnosis_description'],
                        'doctor_id': diagnosis['doctor_id_fk'],
                        'diagnosis_date': diagnosis['diagnosis_date'],
                        'severity': diagnosis['severity'],
                        'medications': medications
                    })

            return {"status": "success", "data": diagnosis_with_medications}

        # Error Handling
        except KeyError as e:
            return {"status": "error", "message": f"Missing key: {str(e)}"}
        except ValueError as e:
            return {"status": "error", "message": f"Invalid value: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error has occurred: {str(e)}"}
    else:
        return {"status": "error", "message": "No database connection provided"}


def convert_decimal(obj):
    # Convert Decimal types to float for JSON serialization
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, date):
        return obj.isoformat() # Convert date to string 
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


if __name__ == '__main__':
    db_connection = get_db_connection()  # Correctly call the function to get a connection


    # get billing by user (with analysis mode) 
    # results = get_billing_by_user(db_connection, 251, analysis_mode=True) 
    # print(json.dumps(results, indent=4, default=convert_decimal))

    #get appointments by user 
    # results = get_appointments_by_user(db_connection, 507, 2, analysis_mode=True) 
    # print(json.dumps(results, indent=4, default=convert_decimal))

    # # get appointments by doctor 
    # results = get_appointments_by_doctor(db_connection, 7501, analysis_mode=True) 
    # print(json.dumps(results, indent=4, default=convert_decimal)) 

    # get user 
    result = get_user(db_connection, email="patient.1@example.com", password="password", analysis_mode=True) 
    print(json.dumps(result, indent=4, default=convert_decimal)) 