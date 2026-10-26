from collections.abc import Mapping
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path
from smtplib import SMTP, SMTP_SSL
from typing import Protocol, cast

from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import settings

TEMPLATE_DIRECTORY = Path(__file__).resolve().parent.parent / "email_templates"
LOGO_PATH = Path(__file__).resolve().parent.parent / "static" / "inner-circle-logo.png"
template_environment = Environment(
    loader=FileSystemLoader(TEMPLATE_DIRECTORY),
    autoescape=select_autoescape(["html", "xml", "jinja"]),
)


class EmailTemplateMacros(Protocol):
    def subject(self) -> str: ...

    def text_body(self) -> str: ...


def render_email_template(
    template_name: str,
    context: Mapping[str, object],
) -> str:
    template = template_environment.get_template(template_name)
    return template.render(**dict(context))


def render_email_parts(
    template_name: str,
    context: Mapping[str, object],
) -> tuple[str, str, str]:
    template = template_environment.get_template(template_name)
    template_context = dict(context)
    template_module = cast(
        EmailTemplateMacros,
        template.make_module(template_context),
    )
    return (
        str(template_module.subject()).strip(),
        str(template_module.text_body()).strip(),
        template.render(**template_context),
    )


def send_templated_email(
    recipient: str,
    template_name: str,
    context: Mapping[str, object],
) -> None:
    sender_domain = settings.smtp_from_email.rsplit("@", maxsplit=1)[-1]
    logo_cid = make_msgid(domain=sender_domain)[1:-1]
    template_context = {**context, "logo_cid": logo_cid}
    subject, text_body, html_body = render_email_parts(
        template_name,
        template_context,
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    message["To"] = recipient
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    html_part = message.get_body(preferencelist=("html",))
    if html_part is None:
        raise RuntimeError("HTML email body was not created")
    html_part.add_related(
        LOGO_PATH.read_bytes(),
        maintype="image",
        subtype="png",
        cid=f"<{logo_cid}>",
    )

    if settings.smtp_secure:
        username = settings.smtp_username
        password = settings.smtp_password
        if username is None or password is None:
            raise RuntimeError("SMTP credentials are required for secure SMTP.")

        with SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=5) as smtp:
            smtp.login(username, password)
            smtp.send_message(message)
    else:
        with SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as smtp:
            smtp.send_message(message)


def send_test_email(recipient: str, username: str, note: str) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="test_template.jinja",
        context={
            "username": username,
            "recipient": recipient,
            "note": note,
        },
    )


def send_registration_verification_email(
    recipient: str,
    username: str,
    verification_link: str,
) -> None:
    expiry_hours = settings.verification_token_expire_hours
    send_templated_email(
        recipient=recipient,
        template_name="registration_verification.jinja",
        context={
            "username": username,
            "verification_link": verification_link,
            "expiry_hours": expiry_hours,
        },
    )


def send_demo_elevation_email(
    recipient: str,
    username: str,
    verification_link: str,
) -> None:
    expiry_hours = settings.verification_token_expire_hours
    send_templated_email(
        recipient=recipient,
        template_name="demo_elevation.jinja",
        context={
            "username": username,
            "verification_link": verification_link,
            "expiry_hours": expiry_hours,
        },
    )


def send_email_change_verification_email(
    recipient: str,
    username: str,
    verification_link: str,
    expiry_hours: int,
) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="email_change_verification.jinja",
        context={
            "username": username,
            "verification_link": verification_link,
            "expiry_hours": expiry_hours,
        },
    )


def send_email_change_notice(
    recipient: str,
    username: str,
    new_email: str,
) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="email_change_notice.jinja",
        context={"username": username, "new_email": new_email},
    )


def send_password_reset_email(
    recipient: str,
    username: str,
    reset_link: str,
    expiry_hours: int,
) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="password_reset.jinja",
        context={
            "username": username,
            "reset_link": reset_link,
            "expiry_hours": expiry_hours,
        },
    )


def send_password_changed_email(recipient: str, username: str) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="password_changed.jinja",
        context={"username": username},
    )


def send_account_deletion_email(
    recipient: str,
    username: str,
    verification_link: str,
    expiry_hours: int,
) -> None:
    send_templated_email(
        recipient=recipient,
        template_name="account_deletion.jinja",
        context={
            "username": username,
            "verification_link": verification_link,
            "expiry_hours": expiry_hours,
        },
    )


def send_welcome_email(email: str, username: str) -> None:
    send_templated_email(
        recipient=email,
        template_name="registration.jinja",
        context={"username": username},
    )
