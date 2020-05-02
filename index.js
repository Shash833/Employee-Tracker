const inquirer = require("inquirer");
const mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: " ", //USER TO ADD PASSWORD
    database: "employee_tracker_DB"
});

//To connect user to database
connection.connect(function (err) {
    if (err) throw err;
    else console.log("Welcome to the employee tracker!")
    beginTracker()
});

//User to be displayed with prompts with how to proceed at beginning and after each task
function initialPrompt() {
    return inquirer.prompt({
        name: "action",
        type: "checkbox",
        message: "What would you like to do?",
        choices: ["Add department", "Add role", "Add employee", "View employees by department", "View departments", "View roles", "View employees", "Update employee roles"]
    })
}

async function beginTracker() {
    try {
        const { action } = await initialPrompt()
        //If the user wants to add a new department:
        if (action == "Add department") {
            addDepartmentPrompt()
        }
        //If the user wants to add a new role:
        else if (action == "Add role") {
            addRolePrompt()

        }
        //If the user wants to add a new employee:
        else if (action == "Add employee") {
            addEmployeePrompt()
        }
        //If user wants to view employees by sepcific departments
        else if (action == "View employees by department") {
            viewDepartmentEmployees()
        }
        //If user wants to view all departments
        else if (action == "View departments") {
            viewDepartments()
        }
        //If user wants to view all roles
        else if (action == "View roles") {
            viewRoles()
        }
        //If user wants to view all employees
        else if (action == "View employees") {
            viewEmployees()
        }
        //If user wants to update an employee's role
        else if (action == "Update employee roles") {
            updateEmployeeRole()
        }
    }
    catch (error) {
        console.log(error);
    }
}


//Function to add new department to database
function addDepartmentPrompt() {
    inquirer.prompt({
        name: "name",
        type: "Input",
        message: "What is the new department name?"
    }).then(function ({ name }) {
        //To add user input value into specific column of department table
        connection.query(
            `INSERT INTO department (name) value ("${name}"); `
        )
        console.log("New department has been added!")
        beginTracker()
    })
}

//Function to add new Role to database
function addRolePrompt() {
    //To retrive list of departments from database
    connection.query("SELECT name FROM department", function (err, results) {
        if (err) throw err;
        inquirer.prompt([
            {
                name: "title",
                type: "input",
                message: "What is the new role title?"
            },
            {
                name: "salary",
                type: "input",
                message: "What is the role's annual salary?"
            },
            {
                name: "department",
                type: "checkbox",
                choices: function () {
                    let departmentArray = []
                    for (let i = 0; i < results.length; i++) {
                        departmentArray.push(results[i].name)
                    }
                    return departmentArray;
                },
                message: "Which department does the new role belong to?"
            }
        ]).then(function ({ department, salary, title }) {
            //Function to obtain department ID from 'department name' provided by the user
            function getDepartmentID() {
                connection.query(`SELECT * FROM department WHERE name = "${department}"`, function (err, result) {
                    if (err) throw err
                    let departmentID = result[0].id
                    postNewRole(departmentID)
                })
            }
            //To add values into specific columns of role table
            function postNewRole(departmentID) {
                connection.query(`INSERT INTO role (title, salary, department_id) value ("${title}", "${salary}", "${departmentID}")`)
                console.log("New role has been added!")
                beginTracker()
            }
            getDepartmentID()
        })
    })
}

//Function to add new employee
function addEmployeePrompt() {
    //To retrieve data from role and employee tables from database
    connection.query("select * from role left join employee on employee.role_id = role.id", function (err, results) {
        if (err) throw err;
        inquirer.prompt([
            {
                name: "first_name",
                type: "input",
                message: "What is the new employee's first name?"
            },
            {
                name: "last_name",
                type: "input",
                message: "What is the new employee's last name?"
            },
            {
                name: "role",
                type: "checkbox",
                choices: function () {
                    const roleArray = []
                    for (let i = 0; i < results.length; i++) {
                        if (roleArray.indexOf(results[i].title) === -1) { roleArray.push(results[i].title) }
                    }
                    return roleArray
                },
                message: "What is the role of the new employee?"
            },
            {
                name: "manager",
                type: "checkbox",
                choices: function () {
                    const managerArray = ["0 Employee has no manager",]
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].first_name != null && results[i].manager_id === 0) { managerArray.push(results[i].id + " " + results[i].first_name + " " + results[i].last_name) }
                    }
                    return managerArray
                },
                message: "Who is the new employee's manager?"
            }
        ]).then(function ({ first_name, last_name, role, manager }) {
            //To obtain manager ID from user selection
            const managerID = parseInt(((manager.toString()).split(" "))[0])
            //To obtain role ID from database using 'role title' provided by user
            function getRoleID() {
                connection.query(`SELECT * FROM role WHERE title = "${role}"`, function (err, result) {
                    if (err) throw err
                    let roleID = result[0].id
                    postNewEmployee(roleID)

                })
            }
            //To insert information on new employee into database
            function postNewEmployee(roleID) {
                connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) value ("${first_name}", "${last_name}", "${roleID}", "${managerID}")`)
                console.log("New employee has been added!")
                beginTracker()
            }
            getRoleID()
        })
    })
}

//Function to view employees within specific departments
function viewDepartmentEmployees() {
    connection.query("SELECT name FROM department", function (err, results) {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    name: "department",
                    type: "rawlist",
                    choices: function () {
                        var departmentArray = [];
                        for (var i = 0; i < results.length; i++) {
                            departmentArray.push(results[i].name);
                        }
                        return departmentArray;
                    },
                    message: "Which department would you like to view?"
                },
            ])
            .then(function ({ department }) {
                connection.query(`SELECT employee.id, first_name, last_name, title, salary, manager_id FROM department join role ON department.id = role.department_id
                    join employee ON role.id = employee.role_id where name = "${department}"`, function (err, results) {
                    if (err) throw err;
                    console.table(results)
                    beginTracker()
                })
            });
    });
}

//To allow user to view all departments
function viewDepartments() {
    connection.query("SELECT * FROM department", function (err, results) {
        if (err) throw err;
        console.table(results)
        beginTracker()
    });
}

//To allow user to view all roles
function viewRoles() {
    connection.query("SELECT * FROM role", function (err, results) {
        if (err) throw err;
        console.table(results)
        beginTracker()
    });
}

//To allow user to view all employees
function viewEmployees() {
    connection.query("SELECT employee.id, first_name, last_name, title, name, salary, manager_id FROM department join role ON department.id = role.department_id join employee ON role.id = employee.role_id", function (err, results) {
        if (err) throw err;
        console.table(results)
        beginTracker()
    });
}

//Function to allow user to update an employee's role
function updateEmployeeRole() {
    //To retrieve employee and role lists from database
    connection.query("SELECT employee.id, first_name, last_name, title FROM employee RIGHT JOIN role on role_id = role.id", function (err, results) {
        if (err) throw err;
        inquirer.prompt([
            {
                name: "employee",
                type: "checkbox",
                choices: function () {
                    var employeeArray = [];
                    for (var i = 0; i < results.length; i++) {
                        employeeArray.push(results[i].id + " " + results[i].first_name + " " + results[i].last_name);
                    }
                    return employeeArray;
                },
                message: "Which employee's role would you like to update?"
            },
            {
                name: "role",
                type: "checkbox",
                choices: function () {
                    var rolesArray = []
                    for (var i = 0; i < results.length; i++) {
                        if (rolesArray.indexOf(results[i].title) === -1) { rolesArray.push(results[i].title) }
                    }
                    return rolesArray
                },
                message: "What is the employee's new role?"
            }
        ])
            .then(function ({ employee, role }) {
                //To obtain employee ID from user selection
                const employeeID = parseInt(((employee.toString()).split(" "))[0])
                //To obtain role ID using 'role title' selected by user
                function getRoleID() {
                    connection.query(`SELECT id FROM role WHERE title = "${role}" `, function (err, results) {
                        if (err) throw err
                        const roleID = results[0].id
                        updateEmployee(roleID)
                    })
                }
                //To update role_id in database
                function updateEmployee(roleID) {
                    connection.query(`UPDATE employee SET role_id = ${roleID} WHERE id = ${employeeID} `)
                    console.log("Employee's role has been updated")
                    begineTracker()
                }
                getRoleID()
            });
    });
}