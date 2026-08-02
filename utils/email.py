def send_welcome_email(email: str, username: str) -> str:
    subject = "Welcome to Inner Circle!"

    body = f"""
Hello {username},

Thank you for registering at Inner Circle.

We're excited to have you on board!

Best regards,
The Inner Circle Team
""".strip()

    mock_email = f"""
To: {email}
Subject: {subject}

{body}
""".strip()

    print(mock_email)
    return mock_email
