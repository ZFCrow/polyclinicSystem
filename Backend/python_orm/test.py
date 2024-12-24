from insert_queries import insert_user
from delete_queries import delete_user
from csv_queries import insert_data_from_csv
from db_queries import delete_and_reset_table
from select_queries import get_user_by_email

# Example dummy data for two users
user_1_info = {
    'role_id': 1,
    'username': 'drjamesbro',
    'password_hash': '5f4dcc3b5aa765d61d8327deb882cf99',  # Example hashed password
    'email': 'james.bro@example.com',
    'created_at': '2023-05-12 08:45:30'
}

user_1_role = {
    'first_name': 'James',
    'last_name': 'Bro',
    'phone_number': '93748513'
}

user_2_info = {
    'role_id': 2,
    'username': 'emilyclark',
    'password_hash': 'd8578edf8458ce06fbc5bb76a58c5ca4',  # Example hashed password
    'email': 'emily.clark@example.com',
    'created_at': '2023-09-15 14:30:10'
}

user_2_role = {
    'first_name': 'Emily',
    'last_name': 'Clark',
    'age': 29,
    'gender': 'Female',
    'phone_number': '87364956',
    'address': '789 Pine Street, Seattle, WA, 98101'
}

# test the functions for the queries
# insert_user(user_1_info, user_1_role) #insert doctor
#insert_user(user_2_info, user_2_role) #insert patient
#delete_user(1, 2) # user_id, role_id
#insert_data_from_csv('../datasets/user.csv', 'user')
#insert_data_from_csv('../datasets/doctor.csv', 'doctor')
#delete_and_reset_table('doctor')
#delete_and_reset_table('user')

#get_user_by_email('kellyolsondoc6@gmail.com')

# add data into tables from csv
#insert_data_from_csv('../datasets/user.csv', 'user')
#insert_data_from_csv('../datasets/doctor.csv', 'doctor')
#insert_data_from_csv('../datasets/patient.csv', 'patient')
#insert_data_from_csv('../datasets/patient_medication.csv', 'patient_medication')
#insert_data_from_csv('../datasets/medication.csv', 'medication')
#insert_data_from_csv('../datasets/medical_condition.csv', 'medical_condition')

