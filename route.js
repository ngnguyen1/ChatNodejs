'use strict';

var fs=require('fs');

module.exports = function(router, multy) {
    router.get('/', function(req, res) {
        res.render('index.ejs');
    });
    
    router.get('/chat', function(req, res) {
        res.render('chat.ejs');
    });
    
    router.post('/images/uploads', function(req, res) {
        console.log(JSON.stringify(req));
    });
    

    
    
};
