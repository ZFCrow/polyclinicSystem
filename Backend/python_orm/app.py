from flask import Flask, jsonify, request, g
import select_queries
import insert_queries
import db_connection
import delete_queries
import update_queries 
from datetime import datetime 
from db_connection import db 
import signal 

app = Flask(__name__)

# Set up the database connection with SSH tunnel and SQLAlchemy
db_connection.setup_db(app)

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()  # Close SQLAlchemy session
    #db_connection.close_ssh_tunnel()  # Close SSH tunnel when the app context ends

@app.before_request
def before_request():
    print(f"Request started at: {datetime.now()}")

@app.after_request
def after_request(response):
    print(f"Request ended at: {datetime.now()}")
    return response

#!=============================================================================


# Define the shutdown handler
def handle_shutdown(signum, frame):
    print("Shutting down application...")
    db_connection.close_ssh_tunnel()
    exit(0)

# Register the shutdown handler with appropriate signals
signal.signal(signal.SIGINT, handle_shutdown)  # Handle Ctrl+C
signal.signal(signal.SIGTERM, handle_shutdown)  # Handle termination signals (e.g., Docker stop)

#* =============================================================================
""" [DONE]
{
"email":"baba@gmail.com",
"password":"123"
}
"""
@app.route('/login', methods=['POST']) 
def login(): 
    if request.method == 'POST':
        data = request.get_json() 
        email = data['email']
        password = data['password']
        res = select_queries.get_user(email, password)
        print (res) 
        if res['status'] == 'success':
            user_id = res['user']['user_id'] 
            user_role = res['user']['role_id_fk'] 
            if user_role == 1: 
                role = 'doctor'
            elif user_role == 2:
                role = 'patient'
            else:
                role = 'admin'

            #get the id by user unless the user is an admin 
            if role != 'admin':
                roleRES = select_queries.get_id_by_user(user_id, user_role) 
                print (roleRES) 
                res['user'][f'{role}_id'] = roleRES[f"{role}_id"] 

        return jsonify({"message": res})
    
'''
{
  "user_info" : {
    "role_id": 2,
    "username": "johndoe",
    "password_hash": "123",
    "email": "baba@gmail.com",
    "first_name": "John",
    "last_name": "Doe"
  }
    ,
	"role_info" : {
      "age": 23,
      "gender": "m",
      "phone_number": "89482392",
      "address": "123, Ang Mo Kio, Lagos"
    }
}
if doctor, 
{
  "user_info" : {
    "role_id": 1,
    "username": "BOBON",
    "password_hash": "12345",
    "email": "mama123@gmail.com",
    "first_name": "Bobon",
    "last_name": "Dobo"
  }
    ,
	"role_info" : {
      "phone_number": "89482312",
      "specialty": "Woman"
    }
}
'''
@app.route('/register', methods=['POST']) 
def register():
    if request.method == "POST": 
        data = request.get_json()
        userInfo = data['user_info'] 
        roleInfo = data['role_info']
        
        # Directly call the insert_user function without dbConnection
        res = insert_queries.insert_user(userInfo, roleInfo)
        
        return jsonify({"message": res})
    

'''
{
  "user_id": 3,
  }
'''
@app.route('/user/<user_id>', methods=['DELETE']) 
def deleteUser(user_id):
    if request.method == "DELETE":
        user_id = int(user_id)
        res = delete_queries.delete_user(user_id) 
        return jsonify({"message": res}) 
    

'''
PATIENT 
{
  "user_info" : {
    "username": "johndoe",
    "password_hash": "123456",
    "email": "papajohn@gmail.com",
    "first_name": "PAPA",
    "last_name": "JOHN",
    "age": 23,
    "phone_number": "89482392",
    "address": "123, Changi"
    }
}

DOCTOR
{
  "user_info" : {
    "username": "johndoe",
    "password_hash": "123456",
    "email": "
    "first_name": "PAPA",
    "last_name": "JOHN"
    "phone_number": "89482392",
    "specialty": "General" 
    }
'''
@app.route('/user/<user_id>', methods=['GET','PUT'])
def updateUser(user_id):
    if request.method == 'PUT':
        data = request.get_json()
        userInfo = data['user_info']
        user_id = int(user_id)
        # res = update_queries.update_user_info(user_id, userInfo)  # Adjusted call to ORM function
        # print ("response", res)  
        while True:
            res = update_queries.update_user_info(user_id, userInfo)
            if (res["message"] == "Validation failed: Conflict detected: The record has been modified by another transaction."):
                print ("retrying request as conflict detected")
                continue 
            break
        return jsonify({"message": res})
    
    elif request.method == 'GET':
        print ("in get user profile") 
        user_id = int(user_id)
        res = select_queries.get_user_profile(user_id)  # Adjusted call to ORM function
        return jsonify({"message": res})
    


#!===============================================================================
'''
POST appointment 
{
  "appointment_info": {
    "date": "2024-09-28",
    "time": "06:10:05",
    "type": "Medical Consultation",
    #! dont need anymore "user_id": 74,
    "patient_id": 4
  }
}
'''
@app.route('/appointment', methods=['POST','GET'])
def getAppointment():
    if request.method == 'POST':
        data = request.get_json()
        print(data) 
        #appointment info should be a dictionary
        appointment_info = data['appointment_info'] 
        res = insert_queries.insert_appointment(appointment_info)
        print (res) 
        return jsonify({"message": res})


@app.route('/appointment/<user_id>/<role_id>', methods=['GET'])
def getAppointments(user_id,role_id):
    if request.method == 'GET':
        user_id = int(user_id)
        role_id = int(role_id)

        res = select_queries.get_appointments_by_user(user_id, role_id)
        print(res)
        return jsonify({"message": res})


@app.route('/appointment/<doctor_id>/', methods=['GET'])
def get_appointments_by_doctor(doctor_id):
    if request.method == 'GET':
        doctor_id = int(doctor_id)
        res = select_queries.get_appointments_by_doctor(doctor_id) 
        print(res) 
        return jsonify({"message": res})

#update appointment/ reassing appointment to another doctor 
@app.route('/appointment/<appointment_id>/<doctor_id>', methods=['PUT'])
def reassignAppointment(appointment_id, doctor_id):
    print("/appointment/<appointment_id>/<doctor_id>")

    if request.method == 'PUT':
        appointment_id = int(appointment_id) 
        doctor_id = int(doctor_id) 
        res = update_queries.reassign_appointment(appointment_id, doctor_id) 
        return jsonify({"message": res})

#!TODO appointments update will show success even if no such appointments
'''
{
  "appointment_info": {
    "date": "2024-09-28",
    "time": "06:10:05",
    "type": "Medical Consultation"
  }
}
'''
@app.route('/userappointment/<patient_id>/<appointment_id>', methods=['PUT'])
def updateAppointment(appointment_id, patient_id):
    print("/userappointment/<patient_id>/<appointment_id>")
    if request.method == 'PUT':
        data = request.get_json()
        appointment_info = data['appointment_info'] 
        appointment_id = int(appointment_id) 
        patient_id = int(patient_id) 
        
        while True:
            res = update_queries.update_appointment(patient_id, appointment_id, appointment_info) 
            if (res["message"] == "Validation failed: Conflict detected: The record has been modified by another transaction."):
                print ("retrying request as conflict detected")
                continue 
            break
        #res = update_queries.update_appointment(patient_id, appointment_id, appointment_info) 
        return jsonify({"message": res})


@app.route('/appointment/<patient_id>/<appointment_id>', methods=['DELETE'])
def deleteAppointment(appointment_id, patient_id):
    if request.method == 'DELETE':
        appointment_id = int(appointment_id) 
        patient_id = int(patient_id) 
        res = delete_queries.delete_appointment(appointment_id, patient_id)
        return jsonify({"message": res})
    
#!===============================================================================
'''
POST diagnosis 
{
    "diagnosis_info": {
                    "patient_id": 4,
                    "diagnosis_description": "autistism detected",
                    "doctor_id": 2,
                    "severity": "moderate"}, 
                    "appointment_id": 1,
    "medication_info": [{
                    "patient_id": 4,
                    "medication_id": 1,
                    "doctor_id": 2,
                    "dosage": 1,
                    "frequency": 1,
                    "duration" : 20

    },
    {
                    "patient_id": 4,
                    "medication_id": 22,
                    "doctor_id": 2,
                    "dosage": 1,
                    "frequency": 1,
                    "duration" : 2

    },{
                    "patient_id": 4,
                    "medication_id": 10,
                    "doctor_id": 2,
                    "dosage": 1,
                    "frequency": 1,
                    "duration" : 30

    }
    ], 
    "role": 1}
'''

# GET all diagnoses for a user
#Post a diagnosis for a user
@app.route('/diagnosis', methods=['POST'])
def Diagnosis():
    
    if request.method == 'POST':
        data = request.get_json()
        #diagnosis info should be a dictionary
        diagnosis_info = data['diagnosis_info'] 
        medication_info = data['medication_info'] 
        role = data['role']
        
        # run the function if role is doctor 
        if role == 1: 
            res = insert_queries.insert_diagnosis(diagnosis_info, medication_info)

            # insert billing as well 
            total = 0 
            
            for med in medication_info:
                price = float(med['price'])
                total += price

            billing_info = {
                "patient_id": diagnosis_info['patient_id'],
                "appointment_id":diagnosis_info['appointment_id'], 
                "amount_due": total,
                "amount_paid": 0,
                "billing_date": datetime.now().strftime("%Y-%m-%d"),
                "payment_method":"cash"
            }            
            billingRes = insert_queries.insert_billing(billing_info)
            res = {"diagnosis": res, "billing": billingRes}
        else:
            res = {"status": "error", "message": "Only doctors can add a diagnosis."}
        return jsonify({"message": res})

#update a diagnosis
#TODO maybe can change to only allow the doctor foreign key to update that record
'''
 {
   "diagnosis_info": {
                     "condition_id_fk": 4,
                     "severity": "Severe"
                    }
 }  
''' 

'''
{
  "diagnosis_id": 2
}
'''
#! use delete method 
@app.route('/diagnosis/<diagnosis_id>', methods=['DELETE'])
def deleteDiagnosis(diagnosis_id):
    if request.method == 'DELETE':
        diagnosis_id = int(diagnosis_id) 
        res = delete_queries.delete_diagnosis(diagnosis_id)
        return jsonify({"message": res})
    


@app.route('/medication', methods=['GET'])
def getMedications():
    if request.method == 'GET':
        res = select_queries.get_medications()
        #print("Result from get_medications:", res)  # Debug print
        return jsonify({"message": res})

@app.route('/medication/<user_id>', methods=['GET'])
def getMedicationByUser(user_id):
    if request.method == 'GET':
        # Assuming `get_medication_by_user` takes a db connection and user_id
        res = select_queries.get_medication_by_user(user_id)
        return jsonify({"message": res})
    

# delete medicaiton 
@app.route('/medication/<medication_id>', methods=['DELETE'])
def deleteMedication(medication_id):
    if request.method == 'DELETE':
        medication_id = int (medication_id) 
        res = delete_queries.delete_medication(medication_id)
        return jsonify({"message": res})  
    

#diagnosis with medications 
@app.route('/diagnosis/<patient_id>/<appointment_id>', methods=['GET'])
def getDiagnosis(patient_id, appointment_id):
    if request.method == 'GET':
        patient_id = int(patient_id)
        appointment_id = int(appointment_id)
        # Assuming `get_diagnosis_by_user` takes a db connection and user_id
        res = select_queries.get_patient_diagnoses_with_medications_by_appointment(patient_id, appointment_id)
        return jsonify({"message": res})
    
#!===============================================================================
'''
POST BILLING 
{
    "billing_info": {
                    "patient_id": 1,
                    "appointment_id": 1,
                    "amount_due": 1,
                    "amount_paid": 10,
                    "billing_date": "2023-01-01",
                    "payment_method":"cash"}
}
'''
@app.route('/billing', methods=['POST'])
def billing():
    if request.method == 'POST':
        data = request.get_json()
        billing_info = data['billing_info'] 
        res = insert_queries.insert_billing(billing_info)
        return jsonify({"message": res})

#delete a billing
@app.route('/billing/<billing_id>', methods=['DELETE'])
def deleteBilling(billing_id):
    if request.method == 'DELETE':
        billing_id = int(billing_id) 
        res = delete_queries.delete_billing(billing_id)
        return jsonify({"message": res})
    


@app.route('/billing/<user_id>', methods=['GET'])
def getBilling(user_id):
    if request.method == 'GET':
        print (" in get billing for user id", user_id)  
        # Assuming `get_billing_by_user` takes a db connection and user_id
        res = select_queries.get_billing_by_user(user_id)
        print (res) 
        return jsonify({"message": res})
'''
payment_info:
- amount_paid
- payment_method
'''


#TODO update billingID needs patientid and appointmentID 
@app.route('/billing/<billing_id>/<appointment_id>/<patient_id>', methods=['PUT']) 
def updateBilling(billing_id, appointment_id, patient_id):  
 
    if request.method == 'PUT':
        data = request.get_json()
        billing_info = data['payment_info'] 
        billing_id = int(billing_id) 
        appointment_id = int(appointment_id)
        patient_id = int(patient_id) 
        res = update_queries.update_billing_status(billing_id,appointment_id, patient_id, billing_info) 
        return jsonify({"message": res})
#!=============================================================================== 
#admin functions
# get all users 
@app.route('/users/<role_id>/<start>/<limit>', methods=['GET'])
def getUsers(role_id, start, limit):
    if request.method == 'GET':
        role_id = int(role_id) 
        start = int(start) 
        limit = int(limit) 

        if role_id == 3: 
            res = select_queries.get_all_users_with_details(start, limit)
            return jsonify({"message": res})
        else:
            res = {"status": "error", "message": "Only admin can view all users."}
            return jsonify({"message": res})
'''
{
    "condition_info":{
        "name":"Ibuprofen",
        "description":"For pain"
    }
}
'''
# insert medical condition 
@app.route('/medical_condition', methods=['POST'])
def medicalCondition():
    if request.method == 'POST':
        data = request.get_json()
        condition_info = data['condition_info'] 
        res = insert_queries.insert_medical_conditions(condition_info)
        return jsonify({"message": res})     
    
#delete a medical condition
@app.route('/medical_condition/<condition_id>', methods=['DELETE'])
def deleteMedicalCondition(condition_id):
    if request.method == 'DELETE':
        condition_id = int(condition_id) 
        res = delete_queries.delete_medical_condition(condition_id)
        return jsonify({"message": res})
    
    
#get all medical conditions (split out so only amdmoin)
@app.route('/medical_condition/<role_id>', methods=['GET'])
def getMedicalConditions(role_id):
    role_id = int(role_id)
    if request.method == 'GET':
        if role_id == 3:  # Assuming role_id 3 is for admin
            res = select_queries.get_medical_conditions()
            return jsonify({"message": res})
        else:
            res = {"status": "error", "message": "Only admin can view all medical conditions."}
            return jsonify({"message": res})


#update medical condition 
'''
{
    "condition_info":{
        "name":"Flu",
        "description":"runny nose"
    }
}
'''
@app.route('/medical_condition/<condition_id>', methods=['PUT'])
def updateMedicalCondition(condition_id):
    
    if request.method == 'PUT':
        data = request.get_json()
        condition_info = data['condition_info'] 
        condition_id = int(condition_id) 
        res = update_queries.update_medical_condition(condition_id, condition_info) 
        return jsonify({"message": res})
#!================================================================================
'''
{
    "medication_info":{
        "name":"Ibuprofen",
        "description":"For pain",
        "price": 10
    }
}
'''
#insert medication
@app.route('/medication', methods=['POST'])
def medication():
    if request.method == 'POST':
        data = request.get_json()
        medication_info = data['medication_info'] 
        res = insert_queries.insert_medication(medication_info)
        return jsonify({"message": res})
    
#update medication
'''
{
    "medication_info":{
        "name":"Ibuprofen",
        "description":"For pain",
        "price": 10
    }
}
''' 
@app.route('/medication/<medication_id>', methods=['PUT'])
def updateMedication(medication_id):
    
    if request.method == 'PUT':
        data = request.get_json()
        medication_info = data['medication_info'] 
        medication_id = int(medication_id) 
    
        res = update_queries.update_medication(medication_id, medication_info) 
        

        return jsonify({"message": res}) 
    
#!===============================================================================


#!===============================================================================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    #app.run(debug=True);
    #app.run(debug=True, host='0.0.0.0', port=5000)
