from utils.email import render_email_parts, render_email_template


def test_render_test_email_includes_and_escapes_request_data() -> None:
    rendered = render_email_template(
        "test_template.jinja",
        {
            "username": "<Casey>",
            "recipient": "person@example.com",
            "note": "A <b>template</b> check.",
            "logo_cid": "inner-circle-logo@example.test",
        },
    )

    assert "&lt;Casey&gt;" in rendered
    assert "A &lt;b&gt;template&lt;/b&gt; check." in rendered
    assert "person@example.com" in rendered
    assert "cid:inner-circle-logo@example.test" in rendered
    assert 'width="40" height="40"' in rendered
    assert "INNER CIRCLE" in rendered


def test_render_registration_email_templates() -> None:
    verification = render_email_template(
        "registration_verification.jinja",
        {
            "username": "Casey",
            "verification_link": "https://example.com/verify/token",
            "expiry_hours": 24,
            "logo_cid": "logo@example.test",
        },
    )
    welcome = render_email_template(
        "registration.jinja",
        {"username": "Casey", "logo_cid": "logo@example.test"},
    )

    assert "https://example.com/verify/token" in verification
    assert "expires in 24 hours" in verification
    assert "Your email is verified" in welcome


def test_render_demo_elevation_email_template() -> None:
    rendered = render_email_template(
        "demo_elevation.jinja",
        {
            "username": "Casey",
            "verification_link": "https://example.com/verify/token",
            "expiry_hours": 24,
            "logo_cid": "logo@example.test",
        },
    )

    assert "upgrade your demo account to a regular" in rendered
    assert "https://example.com/verify/token" in rendered
    assert "expires in 24 hours" in rendered


def test_email_templates_define_subject_text_and_html_parts() -> None:
    templates = (
        (
            "test_template.jinja",
            {
                "username": "Casey",
                "recipient": "casey@example.com",
                "note": "Test note.",
            },
        ),
        ("registration.jinja", {"username": "Casey"}),
        (
            "registration_verification.jinja",
            {
                "username": "Casey",
                "verification_link": "https://example.com/verify",
                "expiry_hours": 24,
            },
        ),
        (
            "demo_elevation.jinja",
            {
                "username": "Casey",
                "verification_link": "https://example.com/elevate",
                "expiry_hours": 24,
            },
        ),
        (
            "email_change_verification.jinja",
            {
                "username": "Casey",
                "verification_link": "https://example.com/email",
                "expiry_hours": 24,
            },
        ),
        (
            "email_change_notice.jinja",
            {"username": "Casey", "new_email": "new@example.com"},
        ),
        (
            "password_reset.jinja",
            {
                "username": "Casey",
                "reset_link": "https://example.com/reset",
                "expiry_hours": 24,
            },
        ),
        ("password_changed.jinja", {"username": "Casey"}),
        (
            "account_deletion.jinja",
            {
                "username": "Casey",
                "verification_link": "https://example.com/delete",
                "expiry_hours": 24,
            },
        ),
    )

    for template_name, context in templates:
        subject, text_body, html_body = render_email_parts(
            template_name,
            {**context, "logo_cid": "logo@example.test"},
        )

        assert subject
        assert text_body
        assert "<!doctype html>" in html_body
        assert "logo@example.test" in html_body


def test_email_parts_include_dynamic_plain_text_values() -> None:
    subject, text_body, _ = render_email_parts(
        "registration_verification.jinja",
        {
            "username": "Casey",
            "verification_link": "https://example.com/verify/token",
            "expiry_hours": 24,
            "logo_cid": "logo@example.test",
        },
    )

    assert subject == "Verify your Inner Circle email"
    assert "Hello Casey" in text_body
    assert "https://example.com/verify/token" in text_body
    assert "expires in 24 hours" in text_body


def test_render_email_change_and_password_templates() -> None:
    shared = {"logo_cid": "logo@example.test"}
    email_change = render_email_template(
        "email_change_verification.jinja",
        {
            **shared,
            "username": "Casey",
            "verification_link": "https://example.com/verify/email-token",
            "expiry_hours": 24,
        },
    )
    email_notice = render_email_template(
        "email_change_notice.jinja",
        {**shared, "username": "Casey", "new_email": "new@example.com"},
    )
    password_reset = render_email_template(
        "password_reset.jinja",
        {
            **shared,
            "username": "Casey",
            "reset_link": "https://example.com/reset/token",
            "expiry_hours": 24,
        },
    )
    password_changed = render_email_template(
        "password_changed.jinja",
        {**shared, "username": "Casey"},
    )

    assert "https://example.com/verify/email-token" in email_change
    assert "new@example.com" in email_notice
    assert "https://example.com/reset/token" in password_reset
    assert "password was changed successfully" in password_changed
