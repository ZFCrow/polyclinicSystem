import pandas as pd

# Load the CSV file
df = pd.read_csv("Cleaned_Datasets/user.csv")

# Check for duplicate values in 'username', 'password_hash', and 'email'
duplicate_username = df[df.duplicated(subset=['username'], keep=False)]
duplicate_password = df[df.duplicated(subset=['password_hash'], keep=False)]
duplicate_email = df[df.duplicated(subset=['email'], keep=False)]

# Display the duplicates
print("Duplicate usernames:")
print(duplicate_username)

print("\nDuplicate password_hash:")
print(duplicate_password)

print("\nDuplicate emails:")
print(duplicate_email)

# Remove any spaces from 'username' and 'email' columns
df['username'] = df['username'].str.replace(' ', '', regex=False)
df['email'] = df['email'].str.replace(' ', '', regex=False)

df.to_csv("Cleaned_Datasets/user.csv", index=False)