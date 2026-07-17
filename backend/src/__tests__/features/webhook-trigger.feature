Feature: Public webhook triggers
  Webhook endpoints must fail closed when misconfigured.

  Scenario: Unauthenticated webhook cannot fire without configured secret
    Given a webhook workflow exists without a secret
    When an anonymous caller POSTs to the webhook URL
    Then the server must reject the request
