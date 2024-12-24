from flask import Flask, jsonify, request, g
import select_queries
import insert_queries
import db_connection
import delete_queries
import update_queries 
import datetime 

app = Flask(__name__)

@app.before_request
def get_db_connection():
    if 'dbConnection' not in g:
        connection = db_connection.get_db_connection()  # Get connection from pool
        g.dbConnection = connection
        print("Database connection established")

@app.teardown_appcontext
def close_db_connection(error): 
    connection = g.pop('dbConnection', None)  # Get the connection from the app context 
    if connection:
        db_connection.close_db_connection(connection)
        print("Database connection returned to pool from flask")


#! Test Routes
#! ===========================================================================================
@app.route('/test')
def home():
    return jsonify({"message": "Hello, Flask!"})  # Return JSON instead of plain text

@app.route('/api/data', methods=['GET']) 
def getUserData():
    dbConnection = g.dbConnection 
    user_data = select_queries.get_user(dbConnection, "emily.clark@example.com")
    return jsonify({"message": user_data})

#! ===========================================================================================


#!=============================================================================
#* =============================================================================
""" [DONE]
{
"email":"baba@gmail.com",
"password":"123"
}
"""
@app.route('/login', methods=['POST']) 
def login():
    dbConnection = g.dbConnection 
    if request.method == 'POST':
        data = request.get_json() 
        email = data['email']
        password = data['password']
        res = select_queries.get_user(dbConnection, email, password)

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
                roleRES = select_queries.get_id_by_user(dbConnection, user_id, user_role)

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
    dbConnection = g.dbConnection 
    if request.method == "POST": 
        data = request.get_json() 
        userInfo = data['user_info'] 
        roleInfo = data['role_info']
        res = insert_queries.insert_user(dbConnection, userInfo, roleInfo) 
        return jsonify({"message": res})
    

'''
{
  "user_id": 3,
  }
'''
@app.route('/user/<user_id>', methods=['DELETE']) 
def deleteUser(user_id):
    dbConnection = g.dbConnection 
    if request.method == "DELETE":
        user_id = int(user_id)
        res = delete_queries.delete_user(dbConnection, user_id) 
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
    dbConnection = g.dbConnection
    
    if request.method == 'PUT':
        data = request.get_json()
        userInfo = data['user_info'] 
        user_id = int(user_id) 
        res = update_queries.update_user_info(dbConnection, user_id, userInfo) 
        return jsonify({"message": res}) 
    elif request.method == 'GET':
        user_id = int(user_id)
        res = select_queries.get_user_profile(dbConnection, user_id)
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
    dbConnection = g.dbConnection

    if request.method == 'POST':
        data = request.get_json()
        #appointment info should be a dictionary
        appointment_info = data['appointment_info'] 
        res = insert_queries.insert_appointment(dbConnection, appointment_info)
        return jsonify({"message": res})


@app.route('/appointment/<user_id>/<role_id>', methods=['GET'])
def getAppointments(user_id,role_id):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        user_id = int(user_id)
        role_id = int(role_id)

        res = select_queries.get_appointments_by_user(dbConnection, user_id, role_id)
        return jsonify({"message": res})



@app.route('/appointment/<doctor_id>/', methods=['GET'])
def getAppointmentsbyDoctor(doctor_id):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        doctor_id = int(doctor_id)
        res = select_queries.get_appointments_by_doctor(dbConnection, doctor_id)
        return jsonify({"message": res})


#update appointment/ reassing appointment to another doctor 
@app.route('/appointment/<appointment_id>/<doctor_id>', methods=['PUT'])
def reassignAppointment(appointment_id, doctor_id):
    dbConnection = g.dbConnection
    print("/appointment/<appointment_id>/<doctor_id>")

    if request.method == 'PUT':
        appointment_id = int(appointment_id) 
        doctor_id = int(doctor_id) 
        res = update_queries.reassign_appointment(dbConnection, appointment_id, doctor_id) 
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
    dbConnection = g.dbConnection
    print("/userappointment/<patient_id>/<appointment_id>")
    if request.method == 'PUT':
        data = request.get_json()
        appointment_info = data['appointment_info'] 
        appointment_id = int(appointment_id) 
        patient_id = int(patient_id) 
        

        res = update_queries.update_appointment(dbConnection, patient_id, appointment_id, appointment_info) 
        return jsonify({"message": res})


@app.route('/appointment/<patient_id>/<appointment_id>', methods=['DELETE'])
def deleteAppointment(appointment_id, patient_id):
    
    dbConnection = g.dbConnection
    if request.method == 'DELETE':
        appointment_id = int(appointment_id) 
        patient_id = int(patient_id) 
        res = delete_queries.delete_appointment(dbConnection, appointment_id, patient_id)
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
    dbConnection = g.dbConnection
    
    if request.method == 'POST':
        data = request.get_json()
        #diagnosis info should be a dictionary
        diagnosis_info = data['diagnosis_info'] 
        medication_info = data['medication_info'] 
        role = data['role']

        # run the function if role is doctor 
        if role == 1: 
            res = insert_queries.insert_diagnosis(dbConnection, diagnosis_info, medication_info)

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
                "billing_date": datetime.datetime.now().strftime("%Y-%m-%d"),
                "payment_method":"cash"
            }            
            billingRes = insert_queries.insert_billing(dbConnection, billing_info)
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

#TODO  works now but if i update a wrong diagnosis id it will still return success instead of no such diagnosis  
@app.route('/diagnosis/<diagnosis_id>', methods=['PUT']) 
def updateDiagnosis(diagnosis_id): 
    dbConnection = g.dbConnection
    
    if request.method == 'PUT':
        data = request.get_json()
        diagnosis_info = data['diagnosis_info'] 
        diagnosis_id = int(diagnosis_id) 
        res = update_queries.update_diagnosis(dbConnection, diagnosis_id, diagnosis_info) 
        return jsonify({"message": res})
    


'''
{
  "diagnosis_id": 2
}
'''
#! use delete method 
@app.route('/diagnosis/<diagnosis_id>', methods=['DELETE'])
def deleteDiagnosis(diagnosis_id):
    dbConnection = g.dbConnection
    if request.method == 'DELETE':
        diagnosis_id = int(diagnosis_id) 
        res = delete_queries.delete_diagnosis(dbConnection, diagnosis_id)
        return jsonify({"message": res})
    


@app.route('/medication', methods=['GET'])
def getMedications():
    dbConnection = g.dbConnection
    if request.method == 'GET':
        res = select_queries.get_medications(dbConnection)
        return jsonify({"message": res})

@app.route('/medication/<user_id>', methods=['GET'])
def getMedicationByUser(user_id):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        # Assuming `get_medication_by_user` takes a db connection and user_id
        res = select_queries.get_medication_by_user(dbConnection, user_id)
        return jsonify({"message": res})
    

# delete medicaiton 
@app.route('/medication/<medication_id>', methods=['DELETE'])
def deleteMedication(medication_id):
    dbConnection = g.dbConnection
    if request.method == 'DELETE':
        medication_id = int (medication_id) 
        res = delete_queries.delete_medication(dbConnection, medication_id)
        return jsonify({"message": res})  
    
#! function not implemented  ?
# @app.route('/diagnosis/<user_id>', methods=['GET'])
# def getDiagnosis(user_id):
#     dbConnection = g.dbConnection
#     if request.method == 'GET':
#         # Assuming `get_diagnosis_by_user` takes a db connection and user_id
#         res = select_queries.get_diagnosis_by_user(dbConnection, user_id)
#         print(res)
#         return jsonify({"message": res})


#diagnosis with medications 
@app.route('/diagnosis/<patient_id>/<appointment_id>', methods=['GET'])
def getDiagnosis(patient_id, appointment_id):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        patient_id = int(patient_id)
        appointment_id = int(appointment_id)
        # Assuming `get_diagnosis_by_user` takes a db connection and user_id
        res = select_queries.get_patient_diagnoses_with_medications_by_appointment(dbConnection, patient_id, appointment_id)
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
    dbConnection = g.dbConnection
    
    if request.method == 'POST':
        data = request.get_json()
        billing_info = data['billing_info'] 
        res = insert_queries.insert_billing(dbConnection, billing_info)
        return jsonify({"message": res})

#delete a billing
@app.route('/billing/<billing_id>', methods=['DELETE'])
def deleteBilling(billing_id):
    dbConnection = g.dbConnection
    if request.method == 'DELETE':
        billing_id = int(billing_id) 
        res = delete_queries.delete_billing(dbConnection, billing_id)
        return jsonify({"message": res})
    


@app.route('/billing/<user_id>', methods=['GET'])
def getBilling(user_id):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        # Assuming `get_billing_by_user` takes a db connection and user_id
        res = select_queries.get_billing_by_user(dbConnection, user_id)
        return jsonify({"message": res})
'''
payment_info:
- amount_paid
- payment_method
'''


#TODO update billingID needs patientid and appointmentID 
@app.route('/billing/<billing_id>/<appointment_id>/<patient_id>', methods=['PUT']) 
def updateBilling(billing_id, appointment_id, patient_id):  
    dbConnection = g.dbConnection
    
    if request.method == 'PUT':
        data = request.get_json()
        billing_info = data['payment_info'] 
        billing_id = int(billing_id) 
        appointment_id = int(appointment_id)
        patient_id = int(patient_id) 
        res = update_queries.update_billing_status(dbConnection, billing_id,appointment_id, patient_id, billing_info) 
        return jsonify({"message": res})
#!=============================================================================== 
#admin functions
# get all users 
@app.route('/users/<role_id>/<start>/<limit>', methods=['GET'])
def getUsers(role_id, start, limit):
    dbConnection = g.dbConnection
    if request.method == 'GET':
        role_id = int(role_id) 
        start = int(start) 
        limit = int(limit) 

        if role_id == 3: 
            res = select_queries.get_all_users_with_details(dbConnection, start, limit)
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
    dbConnection = g.dbConnection
    
    if request.method == 'POST':
        data = request.get_json()
        condition_info = data['condition_info'] 
        res = insert_queries.insert_medical_conditions(dbConnection, condition_info)
        return jsonify({"message": res})     
    
#delete a medical condition
@app.route('/medical_condition/<condition_id>', methods=['DELETE'])
def deleteMedicalCondition(condition_id):
    dbConnection = g.dbConnection
    if request.method == 'DELETE':
        condition_id = int(condition_id) 
        res = delete_queries.delete_medical_condition(dbConnection, condition_id)
        return jsonify({"message": res})
    
    
#get all medical conditions (split out so only amdmoin)
@app.route('/medical_condition/<role_id>', methods=['GET'])
def getMedicalConditions(role_id):
    dbConnection = g.dbConnection
    role_id = int(role_id)
    if request.method == 'GET':
        if role_id == 3: 
            res = select_queries.get_medical_conditions(dbConnection)
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
    dbConnection = g.dbConnection
    
    if request.method == 'PUT':
        data = request.get_json()
        condition_info = data['condition_info'] 
        condition_id = int(condition_id) 
        res = update_queries.update_medical_condition(dbConnection, condition_id, condition_info) 
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
    dbConnection = g.dbConnection
    
    if request.method == 'POST':
        data = request.get_json()
        medication_info = data['medication_info'] 
        res = insert_queries.insert_medication(dbConnection, medication_info)
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
    dbConnection = g.dbConnection
    
    if request.method == 'PUT':
        data = request.get_json()
        medication_info = data['medication_info'] 
        medication_id = int(medication_id) 
        res = update_queries.update_medication(dbConnection, medication_id, medication_info) 
        return jsonify({"message": res}) 
    
#!===============================================================================


#!===============================================================================
if __name__ == '__main__':
    with app.app_context():
        get_db_connection()
    app.run(debug=True)
