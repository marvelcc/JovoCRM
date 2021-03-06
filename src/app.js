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
var quote_fullname;
var quote_title;
var order_id;
var order_status;
var ac_firstname;
var ac_lastname;
var ac_phone;
var uc_fullname;
var uc_phone;
var s_date;
var e_date;
var e_title;


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

    AngebotManagementIntent() {
        this.ask('For whom would you like to generate this quote for?');
    },

    InputAngebotNameIntent() {
        quote_fullname = this.$inputs.ang_fullname.value;
        this.ask('Please give this quote a title.');
    },

    async InputAngebotTitleIntent() {
        quote_title = this.$inputs.ang_title.value;

        var new_quote_id = await generateQuote();
        let speech = 'New quote with ID ' + new_quote_id + ' generated.';

        this.tell(speech);
    },

    async BeschwerdeManagementIntent() {
        var values = await getComplaint();
        var feed_amount = values.feed_amount;
        // var name = values.name;
        // var lastname = values.lastname;
        var fullname = values.fullname;

        let speech = 'You have ' + feed_amount + ' open complaints from following customers. ' + fullname +  '. ';
        this.tell(speech); 
    },

    ServiceManagementIntent() {
        this.ask('Please state the order number.');
    },

    InputOrderIdIntent() {
        order_id = this.$inputs.order_id.value;
        this.ask('What is the new status of this order?');
    },

    async SetNewOrderStatusIntent() {
        order_status = this.$inputs.order_status.value;
        var confirm = await setOrderStatus();
        let speech = 'Order status updated to ' + confirm +  '.';
        this.tell(speech);
    },

    AddContactIntent() {
        this.ask('Please state the new contact\'s full name.');
    },

    InputContactFullNameIntent() {
        ac_firstname = this.$inputs.ac_firstname.value;
        ac_lastname = this.$inputs.ac_lastname.value;
        this.ask('Please state new contact\'s phone number.');
    },

    async InputContactPhoneIntent() {
        ac_phone = this.$inputs.ac_phone.value;
        var result = await addContact();

        let speech = 'New contact with ID ' + result + ' added.';
        this.tell(speech);

    },

    UpdateContactIntent() {
        this.ask('Whose information would you like to update?');
    },

    InputUpdateContactFullNameIntent() {
        uc_fullname = this.$inputs.uc_fullname.value;
        this.ask('Please state the new phone number.');
    },

    async InputUpdateContactPhoneIntent() {
        uc_phone = this.$inputs.uc_phone.value;

        var response = await updateContact();
        let speech = 'Contact updated. ' + response;
        this.tell(speech);
    },

    async UpcomingEventIntent() {
        var log = await getUpcomingEvent();

        let speech = 'You have the following upcoming events. ' + log + '. ';
        this.tell(speech);
    },

    AddEventIntent() {
        this.ask('Please specify the dates.');
    },

    InputEventDateIntent() {
        s_date = this.$inputs.s_date.value;
        e_date = this.$inputs.e_date.value;
        this.tell('from ' + s_date + ' to ' + e_date + '. ')
        this.ask('Please name the purpose of the event.');
    },

    async InputEventTitleIntent() {
        e_title = this.$inputs.event_title.value;
        var submit_time = await addEvent();

        let speech = 'Event created. ' + submit_time;
        this.tell(speech);
    }


});

// ------------------------------------------------------------------
// FUNCTIONS
// ------------------------------------------------------------------



async function addEvent() {
    var local = e_title;
    var local = s_date;
    var local = e_date;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/calendar.event.add',
        body: {
                  "type": "user",
                  "ownerId": "1",
                  "from": s_date,
                  "to": e_date,
                  "section": "3",
                  "skip_time": "Y",
                  "name": e_title
        },
        json: true
    };
    var response = await requestPromise(options);
    var submit_time = response.time;
    return submit_time;

};

async function getUpcomingEvent() {
    const options = {
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/calendar.event.get.nearest',
        json: true // Automatically parses the JSON string in the response
    };
    var response = await requestPromise(options);
    // var e_name = [];
    // var duration = [];
    var log = [];

    for (var i in response.result) {
        // e_name[i] = response.result[i].NAME;
        // duration[i] = 'from ' + response.result[i].DATE_FROM + ' to ' response.result[i].DATE_TO + '. '
        log[i] = response.result[i].NAME + ' ' + ' from ' + response.result[i].DATE_FROM + ' to ' + response.result[i].DATE_TO + '. ';
    };
    return log;

};

async function updateContact() {
    var local = uc_phone;
    var local = uc_fullname;
    var c_id;

    switch(uc_fullname){
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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.contact.update',
        body: {
                  "id": c_id,
                  "fields":{
                    "PHONE":[
                      {
                        "VALUE": uc_phone,
                        "VALUE_TYPE": "WORK",
                        "TYPE_ID": "PHONE"
                      }
                      ]
                }
        },
        json: true
    };    
    var response = await requestPromise(options);
    var result = response.result;
    return result;


};







async function addContact() {
    var local = ac_firstname;
    var local = ac_lastname;
    var local = ac_phone;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.contact.add',
        body: {
                 "fields":
                {
                  "NAME": ac_firstname,
                  "LAST_NAME": ac_lastname,
                  "OPENED": "Y",
                  "HAS_PHONE": "Y",
                  "PHONE": [
                            { "VALUE": ac_phone,
                              "VALUE_TYPE": "WORK", 
                              "TYPE_ID": "PHONE"
                            }
                           ]
                }
        },
        json: true
    };
    var response = await requestPromise(options);
    var result = response.result;
    return result;
};




async function setOrderStatus() {
    var local = order_status;
    var local = order_id;
    var order_code;

    switch(order_status){
        case "accepted":
            order_code = "N";
            break;
        case "paid":
            order_code = "P";
            break;
        case "finished":
            order_code = "F";
            break;
        case "cancelled":
            order_code  = "D";
            break;
        case "returned":
            order_code = "V";
            break;
        default:
            order_code = "N";
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/sale.order.update',
        body: { 
                "id": order_id,
                 "fields":
                {
                  "statusId": order_code
                }
        },
        json: true
    };
    var response = await requestPromise(options);
    var confirm = response.result.order.statusId;
    return confirm;
};



async function generateQuote() {
    var c_id;
    var local = quote_fullname;
    var local = quote_title;

    switch(quote_fullname){
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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.quote.add',
        body: {
                 "fields":
                {
                  "TITLE": quote_title,
                  "CLIENT_TITLE": quote_fullname,
                  "CONTACT_ID": c_id
                }
        },
        json: true
    };
    var response = await requestPromise(options);
    var new_quote_id = response.result;
    return new_quote_id;
};

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

async function getComplaint() {
    const options = {
        uri: 'https://b24-yu6t0j.bitrix24.de/rest/1/ci7xluaos3yg09yo/crm.lead.list',
        json: true // Automatically parses the JSON string in the response
    };
    var response = await requestPromise(options);
    var feed_amount = response.total;
    // var name = [];
    // var lastname = [];
    var fullname  = [];

    for (var i in response.result) {
        // name[i] = response.result[i].NAME;
        // lastname[i] = response.result[i].LAST_NAME;
        fullname[i] = response.result[i].NAME + ' ' + response.result[i].LAST_NAME;
    };

    return {
        feed_amount: feed_amount, 
        // name: name, 
        // lastname: lastname
        fullname: fullname
    };
};


module.exports.app = app;
