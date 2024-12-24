import pandas as pd
import random

# Load the CSV file
df = pd.read_csv("Cleaned_Datasets/user.csv")

# Initialize counters for modifications and rows checked
username_modifications = 0
email_modifications = 0
password_hash_modifications = 0
rows_checked = 0

# Function to generate a random number
def generate_random_number():
    return random.randint(1, 999)  # Adjust the range as needed

# Modify duplicates in the username column
username_counts = df['username'].value_counts()
for username, count in username_counts.items():
    if count > 1:
        duplicate_indices = df[df['username'] == username].index
        for idx in duplicate_indices[1:]:  # Skip the first occurrence
            df.at[idx, 'username'] = f"{username}_{generate_random_number()}"
            username_modifications += 1
    rows_checked += 1
    if rows_checked % 1000 == 0:
        print(f"Checked {rows_checked} rows so far, modified {username_modifications} usernames")

# Reset rows_checked for next column
rows_checked = 0

# Modify duplicates in the email column
email_counts = df['email'].value_counts()
for email, count in email_counts.items():
    if count > 1:
        duplicate_indices = df[df['email'] == email].index
        for idx in duplicate_indices[1:]:  # Skip the first occurrence
            local_part, domain = email.split('@')
            df.at[idx, 'email'] = f"{local_part}_{generate_random_number()}@{domain}"
            email_modifications += 1
    rows_checked += 1
    if rows_checked % 1000 == 0:
        print(f"Checked {rows_checked} rows so far, modified {email_modifications} emails")

# Reset rows_checked for next column
rows_checked = 0

# Modify duplicates in the password_hash column
password_hash_counts = df['password_hash'].value_counts()
for password_hash, count in password_hash_counts.items():
    if count > 1:
        duplicate_indices = df[df['password_hash'] == password_hash].index
        for idx in duplicate_indices[1:]:  # Skip the first occurrence
            df.at[idx, 'password_hash'] = f"{password_hash}_{generate_random_number()}"
            password_hash_modifications += 1
    rows_checked += 1
    if rows_checked % 1000 == 0:
        print(f"Checked {rows_checked} rows so far, modified {password_hash_modifications} password hashes")

# Save the modified DataFrame to a new CSV file
df.to_csv('Cleaned_Datasets/modified_file.csv', index=False)