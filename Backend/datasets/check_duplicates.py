import pandas as pd

# # Load the dataset for doctor
# df = pd.read_csv('Cleaned_Datasets/doctor.csv')

# Load the dataset for patient
df = pd.read_csv('Cleaned_Datasets/patient.csv')

# Combine first_name and last_name to create a full name
df['full_name'] = df['first_name'] + ' ' + df['last_name']

# Check for duplicates in the 'full_name' and 'phone_number' columns
duplicate_rows_full_name = df[df.duplicated('full_name', keep=False)]
duplicate_rows_phone_number = df[df.duplicated('phone_number', keep=False)]

# Sort the duplicate rows by 'full_name' and 'phone_number' to ensure identical names and phone numbers are together
duplicate_rows = pd.concat([duplicate_rows_full_name, duplicate_rows_phone_number]).drop_duplicates().sort_values('full_name')

# Display the duplicate rows if any
if not duplicate_rows.empty:
    print("Duplicate entries found based on 'full_name' or 'phone_number':")
    print(duplicate_rows)

    # Remove all rows that have duplicates in either 'full_name' or 'phone_number' columns
    df_cleaned = df[~df['full_name'].duplicated(keep=False) & ~df['phone_number'].duplicated(keep=False)]

    df_cleaned = df_cleaned.drop(columns=['full_name'])

    # Save the cleaned DataFrame to a new CSV file
    # df_cleaned.to_csv('Cleaned_Datasets/doctor.csv', index=False)
    df_cleaned.to_csv('Cleaned_Datasets/patient.csv', index=False)

    # Confirmation message
    print("Cleaned data has been saved")
else:
    print("No duplicate entries found.")
