const mysql = require('mysql');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: 'date',
  database: 'university_management_system',
});
const SECTION_LIMIT = 20;
const zeroParamPromise = (sql) => {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};
const queryParamPromise = (sql, queryParam) => {
  return new Promise((resolve, reject) => {
    db.query(sql, queryParam, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};
exports.getDashboard = async (req, res, next) => {
  res.render('Admin/dashboard', { page_name: 'overview' });
};
exports.getOverview = async (req, res, next) => {
  const students = await zeroParamPromise('SELECT * FROM students');
  const staffs = await zeroParamPromise('SELECT * FROM faculty');
  const departments = await zeroParamPromise('SELECT * FROM departments');
  const courses = await zeroParamPromise('SELECT * FROM courses');//TODO: Add other tables
  res.render('Admin/overview', {
    students,
    staffs,
    departments,
    courses,
    
    page_name: 'profile',
  });
};
exports.getAddStaff = async (req, res, next) => {
    const sql = 'SELECT DepartmentID, DepartmentName from departments';
    const results = await zeroParamPromise(sql);
    res.render('Admin/Staff/addStaff', {
      departments: results,
      page_name: 'staff',
    });
  };
  
exports.postAddStaff = async (req, res, next) => {
    const { email } = req.body;
    const sql1 = 'SELECT count(*) as `count` FROM person WHERE Email = ?';
    const count = (await queryParamPromise(sql1, [email]))[0].count;
    if (count !== 0) {
        req.flash('error', 'Faculty with that email already exists');
        res.redirect('/admin/addStaff');
    } else {
        const {
            dob,
            firstName,
            lastName,
            department,
            address,
            city,
            postalCode,
            contact,
            state,
        } = req.body;        if (contact.length > 11) {
            req.flash('error', 'Enter a valid phone number');
            return res.redirect('/admin/addStaff');
        }        const personData = {
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            City: city,
            State: state,
            ZipCode: postalCode,
            DateOfBirth: dob,
        };        try {
            
            const sql2 = 'INSERT INTO person SET ?';
            const personResult = await queryParamPromise(sql2, personData);
            const personId = personResult.insertId;             
            const facultyData = {
                DepartmentID: department,
                PersonID: personId,
            };
            const sql3 = 'INSERT INTO faculty SET ?';
            await queryParamPromise(sql3, facultyData);            req.flash('success_msg', 'Faculty added successfully');
            res.redirect('/admin/getAllStaffs');
        } catch (error) {
            console.error("Error inserting faculty:", error);
            req.flash('error', 'Failed to add faculty');
            res.redirect('/admin/addStaff');
        }
    }
};
exports.getRelevantStaff = async (req, res, next) => {
  const sql = 'SELECT DepartmentID, DepartmentName from departments';
  const results = await zeroParamPromise(sql);
  
  
  
  
  res.render('Admin/Staff/selectStaff', {
    departments: results,
    page_name: 'staff',
  });
};
exports.postRelevantStaff = async (req, res, next) => {
  const { department } = req.body;
  if (department === 'None') {
    req.flash('error', 'Please select department for the given section');
    res.redirect('/admin/getStaff');
  } else if (department !== 'None') {
    
    const sql = "SELECT * FROM Faculty_Person_Department where DepartmentID = ?";
    const results = await queryParamPromise(sql, [department]);
    return res.render('Admin/Staff/getStaff', {
      data: results,
      page_name: 'staff',
    });
  } else {
    return res.redirect('/admin/getAllStaffs');
  }
};
exports.getAllStaff = async (req, res, next) => {
  const sql = "SELECT * FROM Faculty_Person_Department";
  const results = await zeroParamPromise(sql);
  res.render('Admin/Staff/getStaff', { data: results, page_name: 'staff' });
};
exports.getStaffSettings = async (req, res, next) => {
  const staffEmail = req.params.id;
  const sql1 = 'SELECT * FROM faculty WHERE email = ?';
  const staffData = await queryParamPromise(sql1, [staffEmail]);
  const address = staffData[0].st_address.split('-');
  staffData[0].address = address;
  const results = await zeroParamPromise('SELECT * from departments');
  let departments = [];
  for (let i = 0; i < results.length; ++i) {
    departments.push(results[i].dept_id);
  }
  res.render('Admin/Staff/setStaff', {
    staffData: staffData,
    departments: departments,
    page_name: 'Staff Settings',
  });
};exports.postStaffSettings = async (req, res, next) => {
  const {
    old_email,
    email,
    dob,
    name,
    gender,
    department,
    address,
    city,
    postalCode,
    contact,
  } = req.body;  const password = dob.toString().split('-').join('');
  const hashedPassword = await hashing(password);  const sql =
    'update staff set st_name=?, gender=?, dob=?, email=?, st_address=?, contact=?, password=?, dept_id=? where email=?';
  await queryParamPromise(sql, [
    name,
    gender,
    dob,
    email,
    address + '-' + city + '-' + postalCode,
    contact,
    hashedPassword,
    department,
    old_email,
  ]);
  req.flash('success_msg', 'Staff added successfully');
  res.redirect('/admin/getStaff');
};exports.getAddStudent = async (req, res, next) => {
  const sql = 'SELECT * FROM courses';  
  const courses = await zeroParamPromise(sql); 
  res.render('Admin/Student/addStudent', {
      courses: courses,
      page_name: 'students',
  });
};exports.postAddStudent = async (req, res, next) => {
  const { email, courseId } = req.body;
  const sql1 = 'SELECT count(*) as `count` FROM person WHERE Email = ?';
  const count = (await queryParamPromise(sql1, [email]))[0].count;
  if (count !== 0) {
      req.flash('error', 'Student with that email already exists');
      res.redirect('/admin/addStudent');
  } else {
      const {
          dob,
          firstName,
          lastName,
          address,
          city,
          postalCode,
          state,
      } = req.body;
      console.log(req.body);
      const contact = req.body['contact[]'];      const personData = {
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          City: city,
          State: state,
          ZipCode: postalCode,
          DateOfBirth: dob,
      };      try {
          
          const sql2 = 'INSERT INTO person SET ?';
          const personResult = await queryParamPromise(sql2, personData);
          const personId = personResult.insertId;           
          const studentData = {
              EnrollmentDate: new Date(),
              PersonID: personId,
          };
          const sql3 = 'INSERT INTO students SET ?';
          const r = await queryParamPromise(sql3, studentData);          
          if (Array.isArray(contact)) {
              const phonePromises = contact.map(phoneNumber => {
                  const phoneData = {
                      PersonID: personId,
                      PhoneNumber: phoneNumber
                  };
                  const sql4 = 'INSERT INTO person_phoneNumbers SET ?';
                  return queryParamPromise(sql4, phoneData);
              });
              await Promise.all(phonePromises);
          }          req.flash('success_msg', 'Student added successfully');
          res.redirect('/admin/getAllStudents');
      } catch (error) {
          console.error("Error inserting student:", error);
          if(error.sqlState === '45000') {
            req.flash('error', 'Failed to add student. The Student must be at least 16 years of age.');
          }
          else {
            req.flash('error', 'Failed to add student');
          }
          res.redirect('/admin/addStudent');
      }
  }
};
exports.getRelevantStudents = async (req, res, next) => {
  const sql = 'SELECT CourseID, CourseName from courses';
  const results = await zeroParamPromise(sql); 
  res.render('Admin/Student/selectStudent', {
      courses: results,
      page_name: 'students',
  });
};exports.postRelevantStudents = async (req, res, next) => {
  const { courseId } = req.body;
  if (courseId === 'None') {
      req.flash('error', 'Please select a course');
      res.redirect('/admin/getRelevantStudents');
  } else {
      const sql = `
          SELECT StudentID, CONCAT(FirstName, ' ', LastName) AS Name, Email, DateOfBirth
          FROM students
          NATURAL JOIN person
          WHERE StudentID IN (SELECT StudentID FROM student_course_mapping WHERE CourseID = ?)
      `;
      const results = await queryParamPromise(sql, [courseId]);
      res.render('Admin/Student/getStudents', {
          data: results,
          page_name: 'students',
      });
  }
};
exports.getAllStudents = async (req, res, next) => {
  const sql = "SELECT StudentID, CONCAT(FirstName, ' ', LastName) AS Name, Email, DateOfBirth, City, State FROM students NATURAL JOIN person";
  const results = await zeroParamPromise(sql);
  res.render('Admin/Student/getStudents', {
      data: results,
      page_name: 'students',
  });
};
exports.getStudentSettings = async (req, res, next) => {
  const studentEmail = req.params.id;
  const sql1 = 'SELECT * FROM PERSON WHERE email = ?';
  const studentData = await queryParamPromise(sql1, [studentEmail]);
  const address = "123";
  studentData[0].address = address;
  const results = await zeroParamPromise('SELECT * from departments');
  let departments = [];
  for (let i = 0; i < results.length; ++i) {
    departments.push(results[i].dept_id);
  }
  res.render('Admin/Student/setStudent', {
    studentData: studentData,
    departments: departments,
    page_name: 'students',
  });
};exports.postStudentSettings = async (req, res, next) => {
  const {
    old_email,
    email,
    dob,
    name,
    gender,
    department,
    address,
    city,
    postalCode,
    contact,
  } = req.body;
  const password = dob.toString().split('-').join('');
  const hashedPassword = await hashing(password);
  const sql1 =
    'select count(*) as `count`, section from student where section = (select max(section) from student where dept_id = ?) AND dept_id = ?';
  const results = await queryParamPromise(sql1, [department, department]);
  let section = 1;
  if (results[0].count !== 0) {
    if (results[0].count == SECTION_LIMIT) {
      section = results[0].section + 1;
    } else {
      section = results[0].section;
    }
  }
  const sql2 =
    'UPDATE STUDENT SET s_name = ?, gender = ?, dob = ?,email = ?, s_address = ?, contact = ?, password = ?, section = ?, dept_id = ? WHERE email = ?';
  await queryParamPromise(sql2, [
    name,
    gender,
    dob,
    email,
    address + '-' + city + '-' + postalCode,
    contact,
    hashedPassword,
    section,
    department,
    old_email,
  ]);
  req.flash('success_msg', 'Student updated successfully');
  res.redirect('/admin/getAllStudents');
};exports.getDept = async (req, res, next) => {
  const results = await zeroParamPromise('SELECT * FROM departments');
  res.render('Admin/Department/getDept', {
    data: results,
    page_name: 'depts',
  });
};
exports.getAddDept = (req, res, next) => {
  res.render('Admin/Department/addDept', { page_name: 'depts' });
};
exports.postAddDept = async (req, res, next) => {
  const deptName = req.body.department;
  const buildingName = req.body.building;  const sql1 = 'SELECT * FROM departments WHERE DepartmentName = ?';
  const results = await queryParamPromise(sql1, [deptName]);
  
  if (results.length !== 0) {
    req.flash('error', 'Department with that name already exists');
    return res.redirect('/admin/addDept');
  } else {
    const sql2 = 'INSERT INTO departments SET ?';
    await queryParamPromise(sql2, {
      DepartmentName: deptName,
      Building_Name: buildingName,
    });
    req.flash('success_msg', 'Department added successfully');
    res.redirect('/admin/getDept');
  }
};
exports.getDeptSettings = async (req, res, next) => {
  const deptId = req.params.id;
  const sql1 = 'SELECT * FROM departments WHERE dept_id = ?';
  const results = await queryParamPromise(sql1, [deptId]);
  res.render('Admin/Department/setDept', {
    name: results[0].d_name,
    id: results[0].dept_id,
    page_name: 'depts',
  });
};exports.postDeptSettings = async (req, res, next) => {
  const { department, deptId } = req.body;
  const sql = 'UPDATE department SET d_name = ? WHERE dept_id = ?';
  await queryParamPromise(sql, [department, deptId]);
  req.flash('success_msg', 'Department changed successfully!');
  res.redirect('/admin/getDept');
};exports.getAllCourse = async (req, res, next) => {
  let sql = `select CourseID, CourseName, Credits, DepartmentName, CONCAT(FirstName, " ", LastName) AS Name from courses NATURAL JOIN faculty_course_mapping JOIN faculty on faculty.facultyID = faculty_course_mapping.facultyID JOIN departments ON departments.departmentID = courses.departmentID NATURAL JOIN person ORDER BY CourseID`;
  const results = await zeroParamPromise(sql);
  res.render('Admin/Course/getCourse', {
    data: results,
    page_name: 'courses',
  });
};
exports.getRelevantCourse = async (req, res, next) => {
  const results = await zeroParamPromise('SELECT DepartmentID, DepartmentName FROM departments');
  res.render('Admin/Course/deptSelect', {
    departments: results,
    page_name: 'courses',
  });
};
exports.postRelevantCourse = async (req, res, next) => {
  const { semester, department } = req.body;  let sql = `select CourseID, CourseName, Credits, DepartmentName, CONCAT(FirstName, " ", LastName) AS Name from courses NATURAL JOIN faculty_course_mapping JOIN faculty on faculty.facultyID = faculty_course_mapping.facultyID JOIN departments ON departments.departmentID = courses.departmentID NATURAL JOIN person ORDER BY CourseID`;
  const params = [];  if (department !== 'None') {
    sql += ` WHERE DepartmentID = ?`;
    params.push(department);
  }
  
  const results = await queryParamPromise(sql, params);
  res.render('Admin/Course/getCourse', {
    data: results,
    page_name: 'courses',
  });
};
exports.getAddCourse = async (req, res, next) => {
  const departments = await zeroParamPromise('SELECT DepartmentID, DepartmentName FROM departments');
  const faculties = await zeroParamPromise('SELECT FacultyID, CONCAT(FirstName, " ", LastName) AS Name FROM faculty JOIN person ON faculty.PersonID = person.PersonID');
  res.render('Admin/Course/addCourse', {
    departments,
    faculties,  
    page_name: 'courses',
  });
};
exports.postAddCourse = async (req, res, next) => {
  const { course, credits, department } = req.body;
  const faculty = req.body['faculty[]'];  
  const courseData = {
    CourseName: course,
    Credits: credits,
    DepartmentID: department,
  };
  const sqlCourse = 'INSERT INTO courses SET ?';
  const result = await queryParamPromise(sqlCourse, courseData);  
  const courseID = result.insertId;  
  if (faculty && Array.isArray(faculty)) {
    const mappingPromises = faculty.map(facultyID => {
      const mappingData = {
        FacultyID: facultyID,
        CourseID: courseID
      };
      const sqlMapping = 'INSERT INTO faculty_course_mapping SET ?';
      return queryParamPromise(sqlMapping, mappingData);
    });    
    await Promise.all(mappingPromises);
  }  
  req.flash('success_msg', 'Course added successfully');
  res.redirect('/admin/getAllCourses');
};
exports.getCourseSettings = async (req, res, next) => {
  const cId = req.params.id;
  const sql1 = 'SELECT * FROM courses WHERE c_id = ?';
  const courseData = await queryParamPromise(sql1, [cId]);
  const deptData = await zeroParamPromise('SELECT * from department');
  res.render('Admin/Course/setCourse', {
    courseData,
    page_name: 'courses',
    departments: deptData,
  });
};
exports.postCourseSettings = async (req, res, next) => {
  let { course, semester, department, credits, c_type, courseId } = req.body;
  const sql =
    'UPDATE courses SET name = ?, semester = ?, credits = ?, c_type = ?, dept_id = ? WHERE c_id = ?';
  await queryParamPromise(sql, [
    course,
    semester,
    credits,
    c_type,
    department,
    courseId,
  ]);
  req.flash('success_msg', 'Course changed successfully!');
  res.redirect('/admin/getAllCourses');
};
exports.getAddClub = async (req, res, next) => {
  const sql = 'SELECT FacultyID, CONCAT(FirstName, " ", LastName) AS Name FROM faculty NATURAL JOIN person';
  const results = await zeroParamPromise(sql);
  
  
  res.render('Admin/Club/addClub', {
      facultyAdvisors: results,  
      page_name: 'clubs',
  });
};
exports.postAddClub = async (req, res, next) => {
  const { clubName, description, facultyAdvisorID } = req.body;  const sql1 = 'SELECT count(*) as `count` FROM clubs WHERE ClubName = ?';
  const count = (await queryParamPromise(sql1, [clubName]))[0].count;
  if (count !== 0) {
      req.flash('error', 'A club with that name already exists');
      res.redirect('/admin/addClub');
  } else {
      const clubData = {
          ClubName: clubName,
          Description: description,
          FacultyAdvisorID: facultyAdvisorID,
      };      try {
          const sql2 = 'INSERT INTO clubs SET ?';
          await queryParamPromise(sql2, clubData);          req.flash('success_msg', 'Club added successfully');
          res.redirect('/admin/getClubs');
      } catch (error) {
          console.error("Error adding club:", error);
          req.flash('error', 'Failed to add club');
          res.redirect('/admin/addClub');
      }
  }
};
exports.getAllClubs = async (req, res, next) => {
  const sql = `SELECT ClubID, ClubName, Description, CONCAT(FirstName, " ", LastName) AS Name FROM clubs NATURAL JOIN Faculty NATURAL JOIN Person`;
  const results = await zeroParamPromise(sql);
  res.render('Admin/Club/getClubs', { data: results, page_name: 'clubs' });
};
exports.getClubSettings = async (req, res, next) => {
  const clubID = req.params.id;
  const sql1 = 'SELECT * FROM clubs WHERE ClubID = ?';
  const clubData = await queryParamPromise(sql1, [clubID]);  const results = await zeroParamPromise('SELECT FacultyAdvisorID FROM faculty');
  let facultyAdvisors = [];
  for (let i = 0; i < results.length; ++i) {
      facultyAdvisors.push(results[i].FacultyAdvisorID);
  }  res.render('Admin/Club/setClub', {
      clubData: clubData[0],
      facultyAdvisors: facultyAdvisors,
      page_name: 'Club Settings',
  });
};exports.postClubSettings = async (req, res, next) => {
  const { clubID, clubName, description, facultyAdvisorID } = req.body;  const sql = 'UPDATE clubs SET ClubName = ?, Description = ?, FacultyAdvisorID = ? WHERE ClubID = ?';
  await queryParamPromise(sql, [clubName, description, facultyAdvisorID, clubID]);  req.flash('success_msg', 'Club updated successfully');
  res.redirect('/admin/getClubs');
};
exports.getRelevantClub = async (req, res, next) => {
  let sql = "SELECT ClubID, ClubName, Description, CONCAT(FirstName, ' ', LastName) AS Name FROM clubs JOIN faculty ON clubs.FacultyAdvisorID=faculty.FacultyID JOIN person ON person.PersonID=faculty.FacultyID;";
  let params = [];  const results = await queryParamPromise(sql, params);
  res.render('Admin/Club/getClubs', { data: results, page_name: 'clubs' });
};
exports.postRelevantClub = async (req, res, next) => {
  const { facultyAdvisorID } = req.body;  if (facultyAdvisorID === 'None') {
    req.flash('error', 'Please select a faculty advisor');
    res.redirect('/admin/getClubs');
  } else {
    const sql = 'SELECT ClubID, ClubName, Description, FacultyAdvisorID FROM clubs WHERE FacultyAdvisorID = ?';
    const results = await queryParamPromise(sql, [facultyAdvisorID]);
    
    res.render('Admin/Club/getClubs', {
      data: results,
      page_name: 'clubs',
    });
  }
};
exports.getAddScholarship = async (req, res, next) => {
  const sql = 'SELECT FacultyID, CONCAT(FirstName, " ", LastName) AS Name FROM faculty NATURAL JOIN person';
  const results = await zeroParamPromise(sql);  res.render('Admin/Scholarship/addScholarship', {
    facultyAdvisors: results,
    page_name: 'scholarships',
  });
};exports.postAddScholarship = async (req, res, next) => {
  const { scholarshipAmount, eligibilityCriteria, facultyAdvisorID } = req.body;  const sql1 = 'SELECT count(*) as `count` FROM scholarships WHERE Amount = ? AND EligibilityCriteria = ?';
  const count = (await queryParamPromise(sql1, [scholarshipAmount, eligibilityCriteria]))[0].count;  if (count !== 0) {
    req.flash('error', 'A scholarship with the same amount and criteria already exists');
    res.redirect('/admin/addScholarship');
  } else {
    const scholarshipData = {
      Amount: scholarshipAmount,
      EligibilityCriteria: eligibilityCriteria,
    };    try {
      const sql2 = 'INSERT INTO scholarships SET ?';
      await queryParamPromise(sql2, scholarshipData);      req.flash('success_msg', 'Scholarship added successfully');
      res.redirect('/admin/getScholarships');
    } catch (error) {
      console.error("Error adding scholarship:", error);
      req.flash('error', 'Failed to add scholarship. The amount should not exceed 5000.');
      res.redirect('/admin/addScholarship');
    }
  }
};
exports.getAllScholarships = async (req, res, next) => {
  const sql = `SELECT ScholarshipID, Amount, EligibilityCriteria FROM scholarships`;
  const results = await zeroParamPromise(sql);
  res.render('Admin/Scholarship/getScholarships', { data: results, page_name: 'scholarships' });
};
exports.getScholarshipSettings = async (req, res, next) => {
  const scholarshipID = req.params.id;
  
  
  const sql1 = 'SELECT * FROM scholarships WHERE ScholarshipID = ?';
  const scholarshipData = await queryParamPromise(sql1, [scholarshipID]);  
  const sql2 = `SELECT s.StudentID, p.FirstName, p.LastName 
                FROM students s
                JOIN person p ON s.PersonID = p.PersonID
                JOIN scholarship_student_mapping ss ON s.StudentID = ss.StudentID
                WHERE ss.ScholarshipID = ?`;
  const students = await queryParamPromise(sql2, [scholarshipID]);  const sql3 = `SELECT s.StudentID, p.FirstName, p.LastName 
                FROM students s
                JOIN person p ON s.PersonID = p.PersonID`;
  const allStudents = await queryParamPromise(sql3);  
  
    res.render('Admin/Scholarship/setScholarship', {
    scholarshipData: scholarshipData[0],
    students: students, 
    allStudents: allStudents, 
    
    page_name: 'Scholarship Settings',
  });
};exports.postScholarshipSettings = async (req, res, next) => {
  const { scholarshipAmount, eligibilityCriteria } = req.body;
  const scholarshipID = req.params.id;  
  const sql1 = 'UPDATE scholarships SET Amount = ?, EligibilityCriteria = ? WHERE ScholarshipID = ?';
  await queryParamPromise(sql1, [scholarshipAmount, eligibilityCriteria, scholarshipID]);  req.flash('success_msg', 'Scholarship updated successfully');
  res.redirect('/admin/getScholarships');
};exports.assignScholarshipToStudent = async (req, res, next) => {
  const { studentID, scholarshipID } = req.body;  
  const checkSql = 'SELECT count(*) as count FROM scholarship_student_mapping WHERE StudentID = ? AND ScholarshipID = ?';
  const count = (await queryParamPromise(checkSql, [studentID, scholarshipID]))[0].count;  if (count !== 0) {
    req.flash('error', 'This student is already awarded the scholarship');
    res.redirect(`/admin/settings/scholarship/${scholarshipID}`);
  } else {
    
    const insertSql = 'INSERT INTO scholarship_student_mapping (StudentID, ScholarshipID) VALUES (?, ?)';
    await queryParamPromise(insertSql, [studentID, scholarshipID]);    req.flash('success_msg', 'Scholarship assigned to student successfully');
    res.redirect(`/admin/settings/scholarship/${scholarshipID}`);
  }
};exports.getRelevantScholarship = async (req, res, next) => {
  const { facultyAdvisorID } = req.query;  let sql = 'SELECT ScholarshipID, Amount, EligibilityCriteria FROM scholarships';
  let params = [];  const results = await queryParamPromise(sql, params);
  res.render('Admin/Scholarship/getScholarships', { data: results, page_name: 'scholarships' });
};
exports.postRelevantScholarship = async (req, res, next) => {
  const { facultyAdvisorID } = req.body;  
  
  
  
    
        
    
    
    
  
};exports.getAddInternship = async (req, res, next) => {
  const sql = 'SELECT StudentID, CONCAT(FirstName, " ", LastName) AS Name FROM students NATURAL JOIN person';
  const results = await zeroParamPromise(sql);  res.render('Admin/Internship/addInternship', {
    students: results,  
    page_name: 'internships',
  });
};exports.postAddInternship = async (req, res, next) => {
  const { companyName, duration, stipend, StudentID } = req.body;  const internshipData = {
    CompanyName: companyName,
    
    
  };  
  try {
    const sql = 'INSERT INTO internships SET ?';
    const result = await queryParamPromise(sql, internshipData);
    const internshipID = result.insertId;
    
    const StudentInternshipData = {
      Duration: duration,
      Stipend: stipend,
      StudentID,
      InternshipID: internshipID
      
      
    };    const sql1 = 'INSERT INTO student_internship_mapping SET ?';
    await queryParamPromise(sql1, StudentInternshipData);    req.flash('success_msg', 'Internship added successfully');
    res.redirect('/admin/getInternships');
  } catch (error) {
    console.error("Error adding internship:", error);
    req.flash('error', 'Failed to add internship');
    res.redirect('/admin/addInternship');
  }
};
exports.getAllInternships = async (req, res, next) => {
  const sql = `SELECT InternshipID, CompanyName FROM internships`;
  const results = await zeroParamPromise(sql);
  res.render('Admin/Internship/getInternships', { data: results, page_name: 'internships' });
};
exports.getInternshipSettings = async (req, res, next) => {
  const internshipID = req.params.id;
  const sql1 = 'SELECT * FROM internships WHERE InternshipID = ?';
  const internshipData = await queryParamPromise(sql1, [internshipID]);  const results = await zeroParamPromise('SELECT FacultyAdvisorID FROM faculty');
  let facultyAdvisors = [];
  for (let i = 0; i < results.length; ++i) {
    facultyAdvisors.push(results[i].FacultyAdvisorID);
  }  res.render('Admin/Internship/setInternship', {
    internshipData: internshipData[0],
    facultyAdvisors: facultyAdvisors,
    page_name: 'Internship Settings',
  });
};exports.postInternshipSettings = async (req, res, next) => {
  const { internshipID, companyName, duration, stipend, facultyAdvisorID } = req.body;  const sql = 'UPDATE internships SET CompanyName = ?, Duration = ?, Stipend = ?, FacultyAdvisorID = ? WHERE InternshipID = ?';
  await queryParamPromise(sql, [companyName, duration, stipend, facultyAdvisorID, internshipID]);  req.flash('success_msg', 'Internship updated successfully');
  res.redirect('/admin/getInternships');
};
exports.getRelevantInternship = async (req, res, next) => {
  const { facultyAdvisorID } = req.query;  let sql = `SELECT internships.InternshipID, concat (FirstName,' ',LastName) as StudentName, internships.CompanyName, Duration, Stipend
FROM internships inner join student_internship_mapping on internships.InternshipID = student_internship_mapping.InternshipID
inner join students on students.StudentID = student_internship_mapping.StudentID
inner join Person on Person.PersonID = students.PersonID`;
  let params = [];  
  
  
  
    const results = await queryParamPromise(sql, params);
  res.render('Admin/Internship/getInternships', { data: results, page_name: 'internships' });
};
exports.postRelevantInternship = async (req, res, next) => {
    
  
  
  
    const sql = 'SELECT InternshipID, CompanyName FROM internships';
    const results = await queryParamPromise(sql);    res.render('Admin/Internship/getInternships', {
      data: results,
      page_name: 'internships',
    });
  
};
exports.getAddAlumni = async (req, res, next) => {
  const sql = 'SELECT DepartmentID, DepartmentName FROM departments';
  const departments = await zeroParamPromise(sql);
  res.render('Admin/Alumni/addAlumni', {
      departments: departments,
      page_name: 'alumni',
  });
};
exports.postAddAlumni = async (req, res, next) => {
  const { graduationDate, currentJobTitle, currentEmployer, name, email, department } = req.body;  const alumniData = {
      GraduationDate: graduationDate,
      CurrentJobTitle: currentJobTitle,
      CurrentEmployer: currentEmployer,
      Name: name,
      Email: email,
      DepartmentID: department,
  };  try {
      const sql = 'INSERT INTO alumni SET ?';
      await queryParamPromise(sql, alumniData);
      req.flash('success_msg', 'Alumni added successfully');
      res.redirect('/admin/getAllAlumni');
  } catch (error) {
      console.error("Error adding alumni:", error);
      req.flash('error', 'Failed to add alumni');
      res.redirect('/admin/addAlumni');
  }
};
exports.getRelevantAlumni = async (req, res, next) => {
  const sql = 'SELECT DepartmentID, DepartmentName FROM departments';
  const departments = await zeroParamPromise(sql);
  res.render('Admin/Alumni/selectAlumni', {
      departments: departments,
      page_name: 'alumni',
  });
};
exports.postRelevantAlumni = async (req, res, next) => {
  const { department } = req.body;  if (!department || department === 'None') {
      req.flash('error', 'Please select a department.');
      res.redirect('/admin/getAlumni');
  } else {
      const sql = `
          SELECT AlumniID, GraduationDate, CurrentJobTitle, CurrentEmployer, Name, Email, DepartmentName
          FROM alumni
          INNER JOIN departments ON alumni.DepartmentID = departments.DepartmentID
          WHERE alumni.DepartmentID = ?`;
      const alumniList = await queryParamPromise(sql, [department]);      res.render('Admin/Alumni/getAlumni', {
          data: alumniList,
          page_name: 'alumni',
      });
  }
};
exports.getAllAlumni = async (req, res, next) => {
  const sql = `
      SELECT AlumniID, GraduationDate, CurrentJobTitle, CurrentEmployer, Name, Email, DepartmentName
      FROM alumni
      INNER JOIN departments ON alumni.DepartmentID = departments.DepartmentID`;
  const alumniList = await zeroParamPromise(sql);  res.render('Admin/Alumni/getAlumni', {
      data: alumniList,
      page_name: 'alumni',
  });
};exports.getAlumniSettings = async (req, res, next) => {
  const alumniID = req.params.id;  
  const sql1 = `
    SELECT AlumniID, GraduationDate, CurrentJobTitle, CurrentEmployer, Name, Email, DepartmentID 
    FROM Alumni 
    WHERE AlumniID = ?`;
  const alumniData = await queryParamPromise(sql1, [alumniID]);  
  const departmentResults = await zeroParamPromise('SELECT DepartmentID, DepartmentName FROM Departments');
  const departments = departmentResults.map(dept => ({
    DepartmentID: dept.DepartmentID,
    DepartmentName: dept.DepartmentName
  }));  
  res.render('Admin/Alumni/setAlumni', {
    alumniData: alumniData[0],
    departments: departments,
    page_name: 'Alumni Settings'
  });
};
exports.postAlumniSettings = async (req, res, next) => {
  const { alumniID, graduationDate, currentJobTitle, currentEmployer, name, email, departmentID } = req.body;  
  const sql = `
    UPDATE Alumni 
    SET GraduationDate = ?, CurrentJobTitle = ?, CurrentEmployer = ?, Name = ?, Email = ?, DepartmentID = ? 
    WHERE AlumniID = ?`;
  await queryParamPromise(sql, [graduationDate, currentJobTitle, currentEmployer, name, email, departmentID, alumniID]);  
  req.flash('success_msg', 'Alumni settings updated successfully');
  res.redirect('/admin/getAlumni');
};
exports.getAddExam = async (req, res, next) => {
  const sql = 'SELECT CourseID, CourseName FROM courses';
  const results = await zeroParamPromise(sql);
  let courses = [];
  for (let i = 0; i < results.length; ++i) {
    courses.push({ CourseID: results[i].CourseID, CourseName: results[i].CourseName });
  }
  res.render('Admin/Exam/addExam', {
    courses: courses,
    page_name: 'exam',
  });
};
exports.postAddExam = async (req, res, next) => {
  const { courseID, examDate, totalMarks } = req.body;
  const sql1 = 'SELECT count(*) as `count` FROM exams WHERE CourseID = ? AND ExamDate = ?';
  const count = (await queryParamPromise(sql1, [courseID, examDate]))[0].count;
  if (count !== 0) {
      req.flash('error', 'Exam for the selected course and date already exists');
      res.redirect('/admin/addExam');
  } else {
      const examData = {
          CourseID: courseID,
          ExamDate: examDate,
          TotalMarks: totalMarks,
      };      try {
          const sql2 = 'INSERT INTO exams SET ?';
          await queryParamPromise(sql2, examData);
          req.flash('success_msg', 'Exam added successfully');
          res.redirect('/admin/getAllExams');
      } catch (error) {
          console.error("Error inserting exam:", error);
          req.flash('error', 'Failed to add exam. The total marks should be between 0 and 100.');
          res.redirect('/admin/addExam');
      }
  }
};
exports.getExams = async (req, res, next) => {
  const sql = `
      SELECT ExamID, ExamDate, TotalMarks, CourseName
      FROM exams
      JOIN courses ON exams.CourseID = courses.CourseID ORDER BY ExamID`;
  const results = await zeroParamPromise(sql);
  res.render('Admin/Exam/getExams', { data: results, page_name: 'exam' });
};
exports.getRelevantExams = async (req, res, next) => {
  const sql = 'SELECT CourseID, CourseName FROM courses';
  const results = await zeroParamPromise(sql);
  let courses = [];
  for (let i = 0; i < results.length; ++i) {
    courses.push({ CourseID: results[i].CourseID, CourseName: results[i].CourseName });
  }
  res.render('Admin/Exam/selectExam', {
    courses: courses,
    page_name: 'exam',
  });
};
exports.postRelevantExams = async (req, res, next) => {
  const { course: courseID } = req.body;
  if (courseID === 'None') {
    req.flash('error', 'Please select a course');
    res.redirect('/admin/getExams');
  } else {
    const sql = "SELECT ExamID, exams.CourseID as CourseID, CourseName, ExamDate, TotalMarks FROM exams JOIN courses ON exams.CourseID = courses.CourseID WHERE exams.CourseID = ?";
    const results = await queryParamPromise(sql, [courseID]);
    res.render('Admin/Exam/getExams', {
      data: results,
      page_name: 'exam',
    });
  }
};exports.getManageExam = async (req, res, next) => {
  const examID = req.params.id;  try {
      
      const examSql = `SELECT ExamID, ExamDate, TotalMarks, CourseName, exams.CourseID
                       FROM exams
                       JOIN courses ON exams.CourseID = courses.CourseID
                       WHERE ExamID = ?`;
      const examDetails = (await queryParamPromise(examSql, [examID]))[0];      
      const studentsSql = `
          SELECT s.StudentID, p.FirstName, p.LastName, sem.Marks
          FROM students s
          JOIN person p ON s.PersonID = p.PersonID
          JOIN student_course_mapping scm ON s.StudentID = scm.StudentID
          LEFT JOIN student_exam_mapping sem ON s.StudentID = sem.StudentID AND sem.ExamID = ?
          WHERE scm.CourseID = ?
      `;
      const students = await queryParamPromise(studentsSql, [examID, examDetails.CourseID]);      res.render('Admin/Exam/manageExam', {
          exam: examDetails,
          students: students,
          page_name: 'exam',
      });
  } catch (error) {
      console.error("Error fetching exam or student details:", error);
      req.flash('error', 'Failed to load exam details or student marks.');
      res.redirect('/admin/getExams');
  }
};exports.postManageExam = async (req, res, next) => {
  const examID = req.params.id;
  const { studentID, marks } = req.body;  try {
      
      if (!studentID || marks === undefined || marks < 0) {
          req.flash('error', 'Invalid input. Marks must be non-negative.');
          return res.redirect(`/admin/editExam/${examID}`);
      }      
      const checkSql = `SELECT COUNT(*) AS count FROM student_exam_mapping WHERE StudentID = ? AND ExamID = ?`;
      const exists = (await queryParamPromise(checkSql, [studentID, examID]))[0].count > 0;      if (exists) {
          
          const updateSql = `UPDATE student_exam_mapping SET Marks = ? WHERE StudentID = ? AND ExamID = ?`;
          await queryParamPromise(updateSql, [marks, studentID, examID]);
          req.flash('success_msg', 'Marks updated successfully.');
      } else {
          
          const insertSql = `INSERT INTO student_exam_mapping (StudentID, ExamID, Marks) VALUES (?, ?, ?)`;
          await queryParamPromise(insertSql, [studentID, examID, marks]);
          req.flash('success_msg', 'Marks added successfully.');
      }      res.redirect(`/admin/editExam/${examID}`);
  } catch (error) {
      console.error("Error updating marks:", error);
      req.flash('error', 'Failed to add or update marks.');
      res.redirect(`/admin/editExam/${examID}`);
  }
};exports.getExamSettings = async (req, res, next) => { };
exports.postExamSettings = async (req, res, next) => { };
exports.postManageExam = async (req, res, next) => {
  const examID = req.params.id;
  const { studentID, marks } = req.body;  try {
      
      if (!studentID || marks === undefined || marks < 0) {
          req.flash('error', 'Invalid input. Marks must be non-negative.');
          return res.redirect(`/admin/manageExam/${examID}`);
      }      
      const checkSql = `SELECT COUNT(*) AS count FROM student_exam_mapping WHERE StudentID = ? AND ExamID = ?`;
      const exists = (await queryParamPromise(checkSql, [studentID, examID]))[0].count > 0;      if (exists) {
          
          const updateSql = `UPDATE student_exam_mapping SET Marks = ? WHERE StudentID = ? AND ExamID = ?`;
          await queryParamPromise(updateSql, [marks, studentID, examID]);
          req.flash('success_msg', 'Marks updated successfully.');
      } else {
          
          const insertSql = `INSERT INTO student_exam_mapping (StudentID, ExamID, Marks) VALUES (?, ?, ?)`;
          await queryParamPromise(insertSql, [studentID, examID, marks]);
          req.flash('success_msg', 'Marks added successfully.');
      }      res.redirect(`/admin/manageExam/${examID}`);
  } catch (error) {
      console.error("Error updating marks:", error);
      req.flash('error', 'Failed to add or update marks.');
      res.redirect(`/admin/manageExam/${examID}`);
  }
};
exports.getAddParentContact = async (req, res, next) => {
  const sql = 'SELECT * from Student_Person';
  const students = await zeroParamPromise(sql);
  res.render('Admin/ParentContact/addParentContact', {
      students: students,
      page_name: 'parentcontact',
  });
};exports.postAddParentContact = async (req, res, next) => {
  const { parentName, phoneNumber, relationship, studentID } = req.body;  
  if (phoneNumber.length > 11 || phoneNumber.length < 10) {
      req.flash('error', 'Enter a valid phone number');
      return res.redirect('/admin/addParentContact');
  }  const parentContactData = {
      ParentName: parentName,
      PhoneNumber: phoneNumber,
      Relationship: relationship,
      StudentID: studentID,
  };  try {
      
      const sql = 'INSERT INTO parent_contact SET ?';
      await queryParamPromise(sql, parentContactData);
      req.flash('success_msg', 'Parent contact added successfully');
      res.redirect('/admin/getAllParents');
  } catch (error) {
      console.error("Error inserting parent contact:", error);
      req.flash('error', 'Failed to add parent contact');
      res.redirect('/admin/addParentContact');
  }
};
exports.getAllParents = async (req, res, next) => {
  const sql = `
      SELECT pc.ParentName, pc.PhoneNumber, pc.Relationship, CONCAT(p.FirstName, ' ', p.LastName) AS StudentName, pc.StudentID
      FROM parent_contact pc
      JOIN students s ON pc.StudentID = s.StudentID
      JOIN person p ON s.PersonID = p.PersonID
  `;
  const results = await zeroParamPromise(sql);
  res.render('Admin/ParentContact/getParentContact', {
      data: results,
      page_name: 'parentcontact',
  });
};
exports.getRelevantParent = async (req, res, next) => {
  const sql = 'SELECT * from Student_Person';
  const students = await zeroParamPromise(sql);
  res.render('Admin/ParentContact/selectParent', {
      students: students,
      page_name: 'parentcontact',
  });
};exports.postRelevantParent = async (req, res, next) => {
  const { studentID } = req.body;
  if (studentID === 'None') {
      req.flash('error', 'Please select a student');
      return res.redirect('/admin/getRelevantParent');
  } else {
      const sql = `
          SELECT pc.ParentName, pc.PhoneNumber, pc.Relationship, CONCAT(p.FirstName, ' ', p.LastName) AS StudentName
          FROM parent_contact pc
          JOIN students s ON pc.StudentID = s.StudentID
          JOIN person p ON s.PersonID = p.PersonID
          WHERE pc.StudentID = ?
      `;
      const results = await queryParamPromise(sql, [studentID]);
      res.render('Admin/ParentContact/getParentContact', {
          data: results,
          page_name: 'parentcontact',
      });
  }
};
exports.getParentSettings = async (req, res, next) => {
  const studentID = req.params.id;
  const sql = `
      SELECT pc.ParentName, pc.PhoneNumber, pc.Relationship, pc.StudentID, p.FirstName, p.LastName
      FROM parent_contact pc
      JOIN students s ON pc.StudentID = s.StudentID
      JOIN person p ON s.PersonID = p.PersonID
      WHERE pc.StudentID = ?
  `;
  const results = await queryParamPromise(sql, [studentID]);
  const parentData = results[0]; 
  res.render('Admin/ParentContact/setParentContact', {
      parentData: parentData,
      page_name: 'parentcontact',
  });
};
exports.postParentSettings = async (req, res, next) => {
  const { parentName, phoneNumber, relationship, studentID } = req.body;  
  if (phoneNumber.length > 11 || phoneNumber.length < 10) {
      req.flash('error', 'Enter a valid phone number');
      return res.redirect(`/admin/settings/parent/${studentID}`);
  }  const parentContactData = {
      ParentName: parentName,
      PhoneNumber: phoneNumber,
      Relationship: relationship,
  };  try {
      
      const sql = 'UPDATE parent_contact SET ? WHERE StudentID = ?';
      await queryParamPromise(sql, [parentContactData, studentID]);      req.flash('success_msg', 'Parent contact updated successfully');
      res.redirect('/admin/getAllParents');
  } catch (error) {
      console.error("Error updating parent contact:", error);
      req.flash('error', 'Failed to update parent contact');
      res.redirect(`/admin/settings/parent/${studentID}`);
  }
};
exports.getAssignCourses = async (req, res, next) => {
  try {
      const courses = await zeroParamPromise('SELECT * FROM courses');
      const students = await zeroParamPromise('SELECT StudentID, CONCAT(FirstName, " ", LastName) AS Name FROM students JOIN person ON students.PersonID = person.PersonID');
      const staff = await zeroParamPromise('SELECT FacultyID, CONCAT(FirstName, " ", LastName) AS Name FROM faculty JOIN person ON faculty.PersonID = person.PersonID');      res.render('Admin/Student/assignCourses', {
          courses: courses,
          students: students,
          staff: staff,
          page_name: 'course'
      });
  } catch (error) {
      console.error(error);
      req.flash('error', 'Error fetching data for course assignment');
      res.redirect('Admin/Student/assignCourses');
  }
};
exports.postAssignCourses = async (req, res, next) => {
  const { assignmentType, studentId, staffId } = req.body;
  const courses = req.body['courses[]'];  try {
      if (assignmentType === 'student') {  
          const promises = courses.map(courseId => {
              const sql = 'INSERT INTO student_course_mapping (StudentID, CourseID) VALUES (?, ?)';
              return queryParamPromise(sql, [studentId, courseId]);
          });
          await Promise.all(promises);
          req.flash('success_msg', 'Courses successfully assigned to student');
      } else if (assignmentType === 'staff') {
          
          const promises = courses.map(courseId => {
              const sql = 'INSERT INTO faculty_course_mapping (FacultyID, CourseID) VALUES (?, ?)';
              return queryParamPromise(sql, [staffId, courseId]);
          });
          await Promise.all(promises);
          req.flash('success_msg', 'Courses successfully assigned to staff');
      }
      
      res.redirect('/admin/assignCourses');
  } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to assign courses');
      res.redirect('/admin/assignCourses');
  }
};exports.getCourseAssignmentsByDepartment = async (req, res, next) => {
  const departmentId = req.query.departmentId || null;  
  try {
      const departments = await zeroParamPromise('SELECT * FROM departments');
      const coursesWithFaculty = await zeroParamPromise(`
          SELECT 
              courses.CourseID,
              courses.CourseName,
              faculty.FacultyID,
              CONCAT(person.FirstName, " ", person.LastName) AS FacultyName,
              departments.DepartmentName,
              departments.DepartmentID
          FROM courses
          JOIN faculty_course_mapping fcm ON courses.CourseID = fcm.CourseID
          JOIN faculty ON fcm.FacultyID = faculty.FacultyID
          JOIN person ON person.PersonID = faculty.PersonID
          JOIN departments ON courses.DepartmentID = departments.DepartmentID
          ${departmentId ? `WHERE courses.DepartmentID = ${departmentId}` : ''}
          ORDER BY departments.DepartmentName, courses.CourseName
      `);      res.render('Admin/Student/viewCourseAssignments', {
          departments: departments,
          coursesWithFaculty: coursesWithFaculty,
          departmentId: departmentId,  
          page_name: 'course_assignment'
      });  } catch (error) {
      console.error(error);
      req.flash('error', 'Failed to fetch course assignments');
      res.redirect('/admin/viewCourseAssignments');
  }
};exports.getPayments = async (req, res, next) => {
  try {
      
      const sql = `
          SELECT 
              payments.PaymentID, 
              payments.PaymentDate, 
              payments.Amount, 
              CONCAT(person.FirstName, ' ', person.LastName) AS StudentName
          FROM payments
          JOIN students ON payments.StudentID = students.StudentID
          JOIN person ON students.PersonID = person.PersonID
          ORDER BY payments.PaymentID ASC;
      `;
      const results = await zeroParamPromise(sql);      res.render('Admin/Payments/getPayments', { 
          payments: results, 
          page_name: 'payment' 
      });
  } catch (error) {
      console.error("Error fetching payments:", error);
      req.flash('error', 'Failed to fetch payments.');
      res.redirect('/admin/payments');
  }
};exports.getPaymentsByStudent = async (req, res, next) => {
  const { studentID } = req.body;  
  if (studentID === 'None') {
      req.flash('error', 'Please select a student');
      res.redirect('/admin/selectStudentForPayments'); 
  } else {
      try {
          
          const sql = `
              SELECT 
                  payments.PaymentID, 
                  payments.PaymentDate, 
                  payments.Amount, 
                  CONCAT(person.FirstName, ' ', person.LastName) AS StudentName
              FROM payments
              JOIN students ON payments.StudentID = students.StudentID
              JOIN person ON students.PersonID = person.PersonID
              WHERE students.StudentID = ?
              ORDER BY payments.PaymentDate DESC;
          `;
          const results = await queryParamPromise(sql, [studentID]);          res.render('Admin/Payments/getPayments', { 
              payments: results, 
              page_name: 'payment' 
          });
      } catch (error) {
          console.error("Error fetching payments for student:", error);
          req.flash('error', 'Failed to fetch payments for the selected student.');
          res.redirect('/admin/payments');
      }
  }
};exports.getAllStudentsP = async (req, res, next) => {
  try {
      const sql = `
          SELECT 
              students.StudentID, 
              CONCAT(person.FirstName, ' ', person.LastName) AS StudentName
          FROM students
          JOIN person ON students.PersonID = person.PersonID;
      `;
      const students = await zeroParamPromise(sql);
      res.render('Admin/Payments/filterPayments', { 
          students: students,
          page_name: 'payment' 
      });
  } catch (error) {
      console.error("Error fetching students:", error);
      req.flash('error', 'Failed to fetch students.');
      res.redirect('/admin/payments');
  }
};
exports.addPayment = async (req, res, next) => {
  const { studentID, amount, paymentDate } = req.body;
  try {
      const sql = `
          INSERT INTO payments (StudentID, Amount, PaymentDate) 
          VALUES (?, ?, ?)
      `;
      await queryParamPromise(sql, [studentID, amount, paymentDate]);      req.flash('success', 'Payment successfully added!');
      res.redirect('/admin/payments');
  } catch (error) {
      console.error("Error adding payment:", error);
      req.flash('error', 'Failed to add payment.');
      res.redirect('/admin/addPayment');
  }
};
exports.getAllStudentsForPaymentForm = async (req, res, next) => {
  try {
      const sql = `
          SELECT 
              students.StudentID, 
              CONCAT(person.FirstName, ' ', person.LastName) AS StudentName
          FROM students
          JOIN person ON students.PersonID = person.PersonID;
      `;
      const students = await zeroParamPromise(sql);      
      res.render('Admin/Payments/addPayment', { 
          students: students,
          page_name: 'payment' 
      });
  } catch (error) {
      console.error("Error fetching students:", error);
      req.flash('error', 'Failed to fetch students.');
      res.redirect('/admin/payments');
  }
};