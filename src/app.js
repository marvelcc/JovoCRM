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
var comp_firstname;
var comp_lastname;
var comp_msg;
var comp_phone;
var ls_fullname;
var milsec = new Date().getTime();

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

        let speech = 'This is '+ prod_desc + '.'; 
        this.tell(speech);
    },

    ServicePhaseIntent() {
        this.ask('Please state your full name.');
    },

    InputServicePhaseNameIntent() {
        comp_firstname = this.$inputs.firstname.value;
        comp_lastname = this.$inputs.lastname.value;
        this.ask('Please state your phone number.');

 
    },

    InputServicePhasePhoneIntent() {
        comp_phone = this.$inputs.sp_phone.value;
        this.ask('Please state your complaint message.');

    },

    async InputComplaintIntent() {
        comp_msg = this.$inputs.complaint_msg.value;

        var comp_response_status = await submitComplaint();

        let speech = 'Your complaint has been submitted.'; 
        this.tell(speech);
    },

    LoyaltyPhaseIntent() {
        this.ask('Please state your full name.');
    },

    async InputLoyalNameIntent() {
        ls_fullname = this.$inputs.lp_fullname.value;
        var loyalstatus = await loyalStatus();

        let speech = 'You are currently '+ loyalstatus + ' status.';
        this.tell(speech);
    },

    async InfluencerPhaseIntent() {
        var tweet_status = await sendTweet();

        let speech = 'Tweet sent'+ tweet_status + '. ';
        this.tell(speech);
    },

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

async function submitComplaint() {
    var local = comp_msg;
    var local = comp_phone;
    var local = comp_lastname;
    var local = comp_firstname;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.lead.add',
        body: {
                 "fields":
                {
                  "TITLE":"Complaint",
                  "NAME": comp_firstname,
                  "HAS_PHONE": "Y",
                  "LAST_NAME": comp_lastname,
                  "COMMENTS": comp_msg,
                  "PHONE": [
                            { "VALUE": comp_phone,
                              "VALUE_TYPE": "WORK" 
                            }
                           ]
                }
        },
        json: true
    };
    var comp_response = await requestPromise(options);
    var comp_response_status = comp_response.result;
    return comp_response_status;
};

async function loyalStatus() {
    var local = ls_fullname;
    var c_id;
    switch(ls_fullname){
        case "Kevin Smith":
        case "Kevin smith":
            c_id = 2;
            break;
        case "Annie Miller":
        case "Annie miller":
            c_id = 4;
            break;
        case "Donald Harrison":
        case "Donald harrison":
            c_id = 6;
            break;            
        case "Jim Wilson":
        case "Jim wilson":
            c_id = 8;
            break;
        default:
            c_id = 0;
    };
    const options = {
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.contact.get?id=' + c_id,
        json: true // Automatically parses the JSON string in the response
    };
    var ls_response = await requestPromise(options);
    var ls_statuscode = ls_response.result.UF_CRM_1561292006844;
    var loyalstatus;

    switch(ls_statuscode){
        case "50":
            loyalstatus = "Platinum";
            break;
        case "44":
            loyalstatus = "Bronze";
            break;
        case "46":
            loyalstatus = "Silver";
            break;
        case "48":
            loyalstatus = "Gold";
            break;
        default:
            loyalstatus = "Error";
    };
    return loyalstatus;
};

async function sendTweet() {

    const options = {
        method: 'POST',
        uri: 'https://hooks.zapier.com/hooks/catch/5229575/oyajtp4/',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            "time": milsec 
        },
        json: true
    };

    var response = await requestPromise(options);
    var tweet_status = response.status;
    return tweet_status;

}; 

module.exports.app = app;
