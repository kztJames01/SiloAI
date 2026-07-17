Feature: Role-based access control
  Workflow mutations require an admin account loaded from the database.

  Scenario: Field worker cannot hit admin-only workflow mutation endpoint
    Given a field worker is authenticated
    When they POST to an admin-only route
    Then the response status should be 403

  Scenario: Admin user passes requireAdmin gate
    Given an admin user is authenticated
    When they POST to an admin-only route
    Then the response status should be 200
