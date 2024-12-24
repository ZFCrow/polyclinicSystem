from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time, Numeric, UniqueConstraint
from db_connection import db
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import relationship 
from sqlalchemy.sql import func # for using `func.now()` to get current timestamp 
import pytz # for timezone conversion 
import datetime # for timezone conversion 


singapore_time = pytz.timezone('Asia/Singapore')

def gmt_plus_8():
    return datetime.datetime.now(singapore_time) 

class BaseModel:
    def to_dict(self):
        """Convert a SQLAlchemy model instance into a dictionary."""
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

class User(db.Model, BaseModel):
    __tablename__ = 'user'
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    role_id_fk = Column(Integer, ForeignKey('role.role_id'), nullable=False)
    username = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(800), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)

    updated_at = Column(DateTime, nullable=False, default=gmt_plus_8, onupdate=gmt_plus_8)   
    created_at = Column(DateTime, nullable=False, default=gmt_plus_8)  
    # Define relationship in `User` that links to `Patient`
    patient = relationship("Patient", back_populates="user", uselist=False)
    # Define relationship in `User` that links to `Doctor` 
    doctor = relationship("Doctor", back_populates="user", uselist=False) 

class Appointment(db.Model, BaseModel):
    __tablename__ = 'appointment'
    appointment_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id_fk = Column(Integer, ForeignKey('patient.patient_id'), nullable=False)
    doctor_id_fk = Column(Integer, ForeignKey('doctor.doctor_id'), nullable=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False)
    type = Column(String(20), nullable=False)

    updated_at = Column(DateTime, nullable=False, default=gmt_plus_8, onupdate=gmt_plus_8)
    # Define relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    billing = relationship("Billing", back_populates="appointment")

class Billing(db.Model, BaseModel):
    __tablename__ = 'billing'
    billing_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id_fk = Column(Integer, ForeignKey('patient.patient_id'), nullable=False)
    appointment_id_fk = Column(Integer, ForeignKey('appointment.appointment_id'), nullable=False)
    amount_due = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    billing_date = Column(Date, nullable=False)
    payment_status = Column(String(255), nullable=False)
    payment_method = Column(String(255), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="billings")
    appointment = relationship("Appointment", back_populates="billing")

class Diagnosis(db.Model, BaseModel):
    __tablename__ = 'diagnosis'
    diagnosis_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id_fk = Column(Integer, ForeignKey('patient.patient_id'), nullable=False)
    doctor_id_fk = Column(Integer, ForeignKey('doctor.doctor_id'), nullable=False)
    diagnosis_date = Column(Date, nullable=False)
    severity = Column(String(500), nullable=False)
    appointment_id_fk = Column(Integer, ForeignKey('appointment.appointment_id'), nullable=True)
    diagnosis_description = Column(String(255), nullable=False)

class Doctor(db.Model, BaseModel):
    __tablename__ = 'doctor'
    doctor_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id_fk = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    phone_number = Column(String(8), unique=True, nullable=False)
    specialty = Column(String(255), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)

    __table_args__ = (
        UniqueConstraint('phone_number', name='uq_phone_number'),
        UniqueConstraint('license_number', name='uq_license_number')
    )

    appointments = relationship("Appointment", back_populates="doctor")
    # Define relationship to link `Doctor` to `User` 
    user = relationship("User", back_populates="doctor", uselist=False)

class MedicalCondition(db.Model, BaseModel):
    __tablename__ = 'medical_condition'
    condition_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=False)

class Medication(db.Model, BaseModel):
    __tablename__ = 'medication'
    medication_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

class Role(db.Model, BaseModel):
    __tablename__ = 'role'
    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(255), nullable=False)

class PatientMedication(db.Model, BaseModel):
    __tablename__ = 'patient_medication'
    pat_med_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id_fk = Column(Integer, ForeignKey('patient.patient_id'), nullable=False)
    medication_id_fk = Column(Integer, ForeignKey('medication.medication_id'), nullable=False)
    doctor_id_fk = Column(Integer, ForeignKey('doctor.doctor_id'), nullable=False)
    dosage = Column(Integer, nullable=False)
    frequency = Column(String(20), nullable=False)
    duration = Column(Integer, nullable=True)
    diagnosis_id_fk = Column(Integer, ForeignKey('diagnosis.diagnosis_id'), nullable=True)

class Patient(db.Model, BaseModel):
    __tablename__ = 'patient'
    patient_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id_fk = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(9), nullable=True)
    phone_number = Column(String(8), nullable=False, unique=True)
    address = Column(String(500), nullable=False)

    appointments = relationship("Appointment", back_populates="patient")
    # Define relationship to link `Patient` to `User`
    user = relationship("User", back_populates="patient")
        # Relationships
    billings = relationship("Billing", back_populates="patient")
