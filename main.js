const open = require('open').default;  
const serverApp = require('./server');
const server = serverApp.listen(3000, async () => {
    console.log("Бэкенд сервер сәтті қосылды!");
    
    try {
        await open('http://localhost:3000', {
            app: { arguments: ['--app=http://localhost:3000'] }
        });
    } catch (err) {
        console.log("Терезені ашу кезінде қате кетті, бірақ сіз мына сілтемемен кіре аласыз: http://localhost:3000");
    }
});
