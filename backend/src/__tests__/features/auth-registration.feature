Feature: User registration security
  Self-service signup must never grant admin privileges.

  Scenario: Attacker cannot self-assign admin role during registration
    Given the registration API is available
    When a client posts role ADMIN in the register body
    Then the created user role must be FIELD
    And the response must not echo ADMIN as granted role

  Scenario: Short passwords are rejected
    Given the registration API is available
    When a client registers with a 7-character password
    Then the response status should be 400

  Scenario: Duplicate email registration is rejected
    Given a user already exists with email taken@example.com
    When another client registers with the same email
    Then the response status should be 400
