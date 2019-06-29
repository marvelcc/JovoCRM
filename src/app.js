'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const requestPromise = require('request-promise-native');

const app = new App();
var product_name;

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    LAUNCH() {
        let speech = 'Hello! Welcome to Jovo CRM! What would you like to do?';
        this.ask(speech);
    },

    PresalesIntent() {
        this.ask('What would you like to buy?');
    },

    async InStoreIntent() {
        
        var p_name = await getProductList();

        let speech = 'We have the following items. ' + p_name + '. Which product would you want?' ;
        this.ask(speech);   
    },

    async ProductDetailIntent() {
        product_name = this.$inputs.product.value;
        getProductDesc();

        var prod_desc = await getProductDesc();

        // let speech = 'test ' + product_name;
        // this.tell(speech);

        let speech = 'This is '+ prod_desc + '.'; 
        this.tell(speech);
    }

});

async function getProductList(){
    //API Call and return data
    const product_list = {
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.product.list',
        json: true // Automatically parses the JSON string in the response
    };
    var prod_response = await requestPromise(product_list);
    var p_name = [];
    for (var i in prod_response.result) {
        p_name[i] = prod_response.result[i].NAME;
    };    
    return p_name;
};

async function getProductDesc() {
    var product_id;
    var local = product_name;
    switch(product_name){
        case "tshirt":
            product_id = 2;
            break;
        case "sneaker":
            product_id = 4;
            break;
        case "jacket":
            product_id = 6;
            break;
        case "jeans":
            product_id = 8;
            break;
        case "hat":
            product_id = 10;
            break;
        default:
            product_id = 2;
        };
    const product_list = {
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.product.get?id=' + product_id,
        json: true // Automatically parses the JSON string in the response
    };
    var prod_response = await requestPromise(product_list);
    var prod_desc = prod_response.result.DESCRIPTION;
    return prod_desc;
};

module.exports.app = app;
