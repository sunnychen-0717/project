# COMP3810SEF Group project  
Project group infomation  
Project name:bookapp  
Group no: 46  
Group member:  
Chen Cheuk Ngai 13822291    
NG Chun Pong 13319138  
Leung Chun Ho 13724170  
Wang ChenXi 13485478  


# Project introduction:  
In this project, we create a bookapp can let the user create their own account. Then they can create the what book they have seen. If they want to eidt or delete the, our app also support these function. On the other hand, We support the user use linux command to finish the create, list, edit and delete funtion.

Project file intro:
- server.js: It is the main node.js entry point. It can start the express app, set up the middleware and connect to mongodb. Then set up the website views, seccions, verify and mounts routes. It also need the dependencies such as express, mongoose, session, bcrypt and express-ejs-layouts.  
- package.json: It defines the app name, app version, scripts and dependencies.  
- public : Express provide the static (CSS, client-side JS) and basie styling for the EJS pages.  
- views : It is EJS templates for server-side rendered pages.
- models : It included the mongoose schemas and models, such as book id, title, author, year, tags, owner, created time.  
- routes : It contains express route handlers and include endpoints for authentication, post, get, put and delete.

# Operation guides for server
The cloud-based server URL for testing: https://project-cnyy.onrender.com  

<img width="2558" height="379" alt="擷取_2025_11_27_23_08_04_81" src="https://github.com/user-attachments/assets/b0114744-47e6-4ade-9ca0-84b4aaad5da8" />

In this first page, it have Home, Create account, Log in and Sign up button  
Home button: use for reverse to the initial page  
Create account/ Sign up button: use for new user to register their own account  
Log in button: use for have account user can login their own account  

<img width="2558" height="606" alt="擷取_2025_11_27_23_14_34_859" src="https://github.com/user-attachments/assets/d9707ad1-643c-4e86-8a21-cfbfbb3744b6" />

In the log in page, when the user do not have an account but clicked log in button, our server provide sign up button to guide them to register their own account. It vice versa in sign up page. 
Also, when then user taken used user name, our server will remind them this name is registered and please change to a new name. Our server required the password length must larger or equal to 6 charaters.

<img width="2558" height="606" alt="擷取_2025_11_27_23_20_55_855" src="https://github.com/user-attachments/assets/91b40ce6-f247-4033-a37a-59987814c393" />

When the user login their own account, it will have Home, Books, Add book, Log out, Filter and Delete button. It will show out all the book with the user to created and the book is independent with different user.
Home button: use for reverse to the initial page  
Books button: use for go to the list of the book page
Add book button: use for create their own book
Filter button: use for find out the book with specific conditions such as book name, author, year or tags  
Delete button: use for delete the book with created book
Log out button: use for log on their own account and go back to initial page

<img width="2558" height="606" alt="擷取_2025_11_27_23_33_23_450" src="https://github.com/user-attachments/assets/b8344acb-c3c8-4509-89b8-718058cf636d" />

In the create book page, the use input the details of book title, author, year and tags then click on create button, the book will create immediately and list on the book page
<img width="2558" height="606" alt="擷取_2025_11_27_23_38_41_938" src="https://github.com/user-attachments/assets/8d4eb13a-62c7-433d-a6d8-141e0f43b328" />
<img width="2558" height="606" alt="擷取_2025_11_27_23_38_48_804" src="https://github.com/user-attachments/assets/31ffc1b1-8552-408d-9cd0-bce71ce84a40" />


Default testing account   
Name: germany   
Password: germany    

Name:france  
Password:123456  

How to run
Run in local host:  
download all the file, then run it in Terminal  
cd project  
npm install  
npm start    

Run in cloud-based server:  
click on this link: https://project-cnyy.onrender.com


Curl command to achieve CRUD function:  
Login:  
curl -i -c cookies.txt -X POST https://project-cnyy.onrender.com/login
-H "Content-Type: application/x-www-form-urlencoded"
--data "name=germany&password=germany"

Create a book:  
curl -i -b cookies.txt -X POST https://project-cnyy.onrender.com/api/books -H "Content-Type: application/json" -d '{"title":"The Pragmatic Programmer","author":"Andrew Hunt","year":1999,"tags":["software","craft"]}'

List the book:  
curl -i -b cookies.txt https://project-cnyy.onrender.com/api/books

Update the book:  
curl -i -b cookies.txt -X PUT https://project-cnyy.onrender.com/api/books/edit -H "Content-Type: application/json" -d '{"title":"PragProg (20th)","author":"Andrew Hunt","year":2019,"tags":["software","craft"]}'  
*While use this command, the word edit need to change to the book id which is shown in the linux terminal

Delete the book:  
curl -i -b cookies.txt -X DELETE https://project-cnyy.onrender.com/api/books/BOOK_ID   
*While use this command, the word BOOK_ID need to change to the book id which is shown in the linux terminal

