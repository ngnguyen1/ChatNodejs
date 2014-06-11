'use strict';

module.exports = function(router) {
    router.get('/', function(req, res) {
        res.render('index.ejs');
    });
    
    router.get('/chat', function(req, res) {
        res.render('chat.ejs');
    });
};
