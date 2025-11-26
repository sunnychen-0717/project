# COMP3810SEF Group project  
Project infomation  
Project name:bookapp  
Group no: 46  
Group member:  
Chen Cheuk Ngai 13822291    
NG Chun Pong 13319138  
Leung Chun Ho 13724170  
Wang ChenXi 13485478  


Project introduction:  
In this project, we create a bookapp can let the user create their own account. Then they can create the what book they have seen. If they want to eidt or delete the, our app also support these function. On the other hand, We support the user use linux command to finish the create, list, edit and delete funtion.



Project file intro:
- server.js: a brief summary of the functionalities it provided, …
- package.json: lists of dependencies, …
- public (folder, if you have): what static files are included, …
- views (folder, if you have): what EJS or UI files included, …
- models (folder, if you have): what model files are included, …
- routes



  
We are using render to build up a cloud-based server, there is the cloud-based server URL for testing:  
http://localhost:8099  




Operation guides  server
- Use of Login/Logout pages: a list of valid login information, sign-in steps? …
- Use of your CRUD web pages: which button or UI is used to implement create, read,
update, and delete?
- Use of your RESTful CRUD services: the lists of APIs? HTTP request types? Path URI?
How to test them? CURL testing commands?
Notes:
- `README.md` is important to let me know your project functions, which is crucial to marking the grade
of your project.

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



Curl command:  
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

Delete the book:  
curl -i -b cookies.txt -X DELETE https://project-cnyy.onrender.com/api/books/BOOK_ID   


