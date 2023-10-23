"use strict";


function ch_convert_file_path_to_url(path){
    let prefix = "file=";
    let path_to_url = path.replaceAll('\\', '/');
    return prefix+path_to_url;
}

function ch_img_node_str(path){
    return `<img src='${ch_convert_file_path_to_url(path)}' style="width:24px"/>`;
}


function ch_gradio_version(){
    let foot = gradioApp().getElementById("footer");
    if (!foot){return null;}

    let versions = foot.querySelector(".versions");
    if (!versions){return null;}

    if (versions.innerHTML.indexOf("gradio: 3.16.2")>0) {
        return "3.16.2";
    } else {
        return "3.23.0";
    }
    
}


// send msg to python side by filling a hidden text box
// then will click a button to trigger an action
// msg is an object, not a string, will be stringify in this function
function send_ch_py_msg(msg){
    console.log("run send_ch_py_msg")
    let js_msg_txtbox = gradioApp().querySelector("#ch_js_msg_txtbox textarea");
    if (js_msg_txtbox && msg) {
        // fill to msg box
        js_msg_txtbox.value = JSON.stringify(msg);
        js_msg_txtbox.dispatchEvent(new Event("input"));
    }

}

// get msg from python side from a hidden textbox
// normally this is an old msg, need to wait for a new msg
function get_ch_py_msg(){
    console.log("run get_ch_py_msg")
    const py_msg_txtbox = gradioApp().querySelector("#ch_py_msg_txtbox textarea");
    if (py_msg_txtbox && py_msg_txtbox.value) {
        console.log("find py_msg_txtbox");
        console.log("py_msg_txtbox value: ");
        console.log(py_msg_txtbox.value)
        return py_msg_txtbox.value
    } else {
        return ""
    }
}


// get msg from python side from a hidden textbox
// it will try once in every sencond, until it reach the max try times
const get_new_ch_py_msg = (max_count=5) => new Promise((resolve, reject) => {
    console.log("run get_new_ch_py_msg")

    let count = 0;
    let new_msg = "";
    let find_msg = false;
    const interval = setInterval(() => {
        const py_msg_txtbox = gradioApp().querySelector("#ch_py_msg_txtbox textarea");
        count++;

        if (py_msg_txtbox && py_msg_txtbox.value) {
            console.log("find py_msg_txtbox");
            console.log("py_msg_txtbox value: ");
            console.log(py_msg_txtbox.value)

            new_msg = py_msg_txtbox.value
            if (new_msg != "") {
                find_msg=true
            }
        }

        if (find_msg) {
            //clear msg in both sides
            py_msg_txtbox.value = "";
            py_msg_txtbox.dispatchEvent(new Event("input"));

            resolve(new_msg);
            clearInterval(interval);
        } else if (count > max_count) {
            //clear msg in both sides
            py_msg_txtbox.value = "";
            py_msg_txtbox.dispatchEvent(new Event("input"));

            reject('');
            clearInterval(interval);
        }

    }, 1000);
})


function getActiveTabType() {
    const currentTab = get_uiCurrentTabContent();
    switch (currentTab.id) {
        case "tab_txt2img":
            return "txt2img";
        case "tab_img2img":
            return "img2img";
    }
    return null;
}



function getActivePrompt() {
    const currentTab = get_uiCurrentTabContent();
    switch (currentTab.id) {
        case "tab_txt2img":
            return currentTab.querySelector("#txt2img_prompt textarea");
        case "tab_img2img":
            return currentTab.querySelector("#img2img_prompt textarea");
    }
    return null;
}

function getActiveNegativePrompt() {
    const currentTab = get_uiCurrentTabContent();
    switch (currentTab.id) {
        case "tab_txt2img":
            return currentTab.querySelector("#txt2img_neg_prompt textarea");
        case "tab_img2img":
            return currentTab.querySelector("#img2img_neg_prompt textarea");
    }
    return null;
}


//button's click function
async function open_model_url(event, model_type, search_term){
    console.log("start open_model_url");

    //get hidden components of extension 
    let js_open_url_btn = gradioApp().getElementById("ch_js_open_url_btn");
    if (!js_open_url_btn) {
        return
    }


    //msg to python side
    let msg = {
        "action": "",
        "model_type": "",
        "search_term": "",
        "prompt": "",
        "neg_prompt": "",
    }


    msg["action"] = "open_url";
    msg["model_type"] = model_type;
    msg["search_term"] = search_term;
    msg["prompt"] = "";
    msg["neg_prompt"] = "";

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_open_url_btn.click();

    // stop parent event
    event.stopPropagation()
    event.preventDefault()

    //check response msg from python
    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
        
    } catch (error) {
        console.log(error);        
    }
    
    console.log("new_py_msg:");
    console.log(new_py_msg);

    //check msg
    if (new_py_msg) {
        let py_msg_json = JSON.parse(new_py_msg);
        //check for url
        if (py_msg_json && py_msg_json.content) {
            if (py_msg_json.content.url) {
                window.open(py_msg_json.content.url, "_blank");
            }

        }


    }

    
    console.log("end open_model_url");


}

function add_trigger_words(event, model_type, search_term){
    console.log("start add_trigger_words");

    //get hidden components of extension 
    let js_add_trigger_words_btn = gradioApp().getElementById("ch_js_add_trigger_words_btn");
    if (!js_add_trigger_words_btn) {
        return
    }


    //msg to python side
    let msg = {
        "action": "",
        "model_type": "",
        "search_term": "",
        "prompt": "",
        "neg_prompt": "",
    }

    msg["action"] = "add_trigger_words";
    msg["model_type"] = model_type;
    msg["search_term"] = search_term;
    msg["neg_prompt"] = "";

    // get active prompt
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt.value;

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_add_trigger_words_btn.click();

    console.log("end add_trigger_words");

    event.stopPropagation()
    event.preventDefault()

    
}

function use_preview_prompt(event, model_type, search_term){
    console.log("start use_preview_prompt");

    //get hidden components of extension 
    let js_use_preview_prompt_btn = gradioApp().getElementById("ch_js_use_preview_prompt_btn");
    if (!js_use_preview_prompt_btn) {
        return
    }

    //msg to python side
    let msg = {
        "action": "",
        "model_type": "",
        "search_term": "",
        "prompt": "",
        "neg_prompt": "",
    }

    msg["action"] = "use_preview_prompt";
    msg["model_type"] = model_type;
    msg["search_term"] = search_term;

    // get active prompt
    let act_prompt = getActivePrompt();
    msg["prompt"] = act_prompt.value;

    // get active neg prompt
    let neg_prompt = getActiveNegativePrompt();
    msg["neg_prompt"] = neg_prompt.value;

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_use_preview_prompt_btn.click();

    console.log("end use_preview_prompt");

    event.stopPropagation()
    event.preventDefault()

}


async function remove_card(event, model_type, search_term){
    console.log("start remove_card");

    //get hidden components of extension 
    let js_remove_card_btn = gradioApp().getElementById("ch_js_remove_card_btn");
    if (!js_remove_card_btn) {
        return
    }

    // must confirm before removing
    let rm_confirm = "\nConfirm to remove this model.\n\nCheck console log for detail.";
    if (!confirm(rm_confirm)) {
        return
    }


    //msg to python side
    let msg = {
        "action": "",
        "model_type": "",
        "search_term": "",
    }


    msg["action"] = "remove_card";
    msg["model_type"] = model_type;
    msg["search_term"] = search_term;
    msg["prompt"] = "";
    msg["neg_prompt"] = "";

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_remove_card_btn.click();

    // stop parent event
    event.stopPropagation()
    event.preventDefault()

    //check response msg from python
    let new_py_msg = "";
    try {
        new_py_msg = await get_new_ch_py_msg();
    } catch (error) {
        console.log(error);
        new_py_msg = error;
    }
    
    console.log("new_py_msg:");
    console.log(new_py_msg);

    //check msg
    // let result = "Done";
    // if (new_py_msg) {
    //     result = new_py_msg;
    // }

    // alert result
    // alert(result);

    // 삭제 후 리프레쉬 하는 코드
    // if (result=="Done"){
    //     console.log("refresh card list");
    //     //refresh card list
    //     let active_tab = getActiveTabType();
    //     console.log("get active tab id: " + active_tab);
    //     if (active_tab){
    //         let refresh_btn_id = active_tab + "_extra_refresh";
    //         let refresh_btn = gradioApp().getElementById(refresh_btn_id);
    //         if (refresh_btn){
    //             console.log("click button: "+refresh_btn_id);
    //             refresh_btn.click();
    //         }
    //     }
    // }
    
    console.log("end remove_card");


}

function open_filepath(event, model_type, search_term) {

    if (model_type == "ckp") {
        console.log("this is ckp model")
        const lastIndex = search_term.lastIndexOf(" ");

        if (lastIndex !== -1) {
            search_term = search_term.slice(0, lastIndex);
        }

        console.log("search_term: " + search_term);
    }

    console.log("start open_filepath");

    //get hidden components of extension 
    let js_open_filepath_btn = gradioApp().getElementById("ch_js_open_filepath_btn");
    if (!js_open_filepath_btn) {
        return
    }

    //msg to python side
    let msg = {
        "action": "",
        "model_type": "",
        "search_term": "",
    }

    msg["action"] = "open_filepath";
    msg["model_type"] = model_type;
    msg["search_term"] = search_term;

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_open_filepath_btn.click();

    console.log("end open_filepath");

    event.stopPropagation()
    event.preventDefault()

}


// download model's new version into SD at python side
function ch_dl_model_new_version(event, model_path, version_id, download_url){
    console.log("start ch_dl_model_new_version");

    // must confirm before downloading
    let dl_confirm = "\nConfirm to download.\n\nCheck Download Model Section's log and console log for detail.";
    if (!confirm(dl_confirm)) {
        return
    }

    //get hidden components of extension 
    let js_dl_model_new_version_btn = gradioApp().getElementById("ch_js_dl_model_new_version_btn");
    if (!js_dl_model_new_version_btn) {
        return
    }

    //msg to python side
    let msg = {
        "action": "",
        "model_path": "",
        "version_id": "",
        "download_url": "",
    }

    msg["action"] = "dl_model_new_version";
    msg["model_path"] = model_path;
    msg["version_id"] = version_id;
    msg["download_url"] = download_url;

    // fill to msg box
    send_ch_py_msg(msg)

    //click hidden button
    js_dl_model_new_version_btn.click();

    console.log("end dl_model_new_version");

    event.stopPropagation()
    event.preventDefault()


}


onUiLoaded(() => {

    //get gradio version
    let gradio_ver = ch_gradio_version();
    console.log("gradio_ver:" + gradio_ver);

    // get all extra network tabs
    let tab_prefix_list = ["txt2img", "img2img"];
    let model_type_list = ["textual_inversion", "hypernetworks", "checkpoints", "lora"];
    let cardid_suffix = "cards";

    //get init py msg
    // let init_py_msg_str = get_ch_py_msg();
    // let extension_path = "";
    // if (!init_py_msg_str) {
    //     console.log("Can not get init_py_msg");
    // } else {
    //     init_py_msg = JSON.parse(init_py_msg_str);
    //     if (init_py_msg) {
    //         extension_path = init_py_msg.extension_path;
    //         console.log("get extension path: " + extension_path);
    //     }
    // }

    // //icon image node as string
    // function icon(icon_name){
    //     let icon_path = extension_path+"/icon/"+icon_name;
    //     return ch_img_node_str(icon_path);
    // }


    // update extra network tab pages' cards
    // * replace "replace preview" text button into an icon
    // * add 3 button to each card:
    //  - open model url 🌐
    //  - add trigger words 💡
    //  - use preview image's prompt 🏷️
    // notice: javascript can not get response from python side
    // so, these buttons just sent request to python
    // then, python side gonna open url and update prompt text box, without telling js side.
    function update_card_for_civitai(){

        //css
        let btn_margin = "0px 5px";
        let btn_fontSize = "200%";
        let btn_thumb_fontSize = "100%";
        let btn_thumb_display = "inline";
        let btn_thumb_pos = "static";
        let btn_thumb_backgroundImage = "none";
        let btn_thumb_background = "rgba(0, 0, 0, 0.8)";

        let ch_btn_txts = ['🌐', '💡', '🏷️'];
        let replace_preview_text = getTranslation("replace preview");
        if (!replace_preview_text) {
            replace_preview_text = "replace preview";
        }


        //change all "replace preview" into an icon
        let extra_network_id = "";
        let extra_network_node = null;
        let button_row = null;
        let search_term_node = null;
        let search_term = "";
        let model_type = "";
        let cards = null;
        let need_to_add_buttons = false;

        //get current tab
        let active_tab_type = getActiveTabType();
        if (!active_tab_type){active_tab_type = "txt2img";}

        for (const tab_prefix of tab_prefix_list) {
            if (tab_prefix != active_tab_type) {continue;}


            //find out current selected model type tab
            let active_extra_tab_type = "";
            let extra_tabs = gradioApp().getElementById(tab_prefix+"_extra_tabs");
            if (!extra_tabs) {console.log("can not find extra_tabs: " + tab_prefix+"_extra_tabs");}

            //get active extratab
            const active_extra_tab = Array.from(get_uiCurrentTabContent().querySelectorAll('.extra-network-cards,.extra-network-thumbs'))
                .find(el => el.closest('.tabitem').style.display === 'block')
                ?.id.match(/^(txt2img|img2img)_(.+)_cards$/)[2]

                
            console.log("found active tab: " + active_extra_tab);

            switch (active_extra_tab) {
                case "textual_inversion":
                    active_extra_tab_type = "ti";
                    break;
                case "hypernetworks":
                    active_extra_tab_type = "hyper";
                    break;
                case "checkpoints":
                    active_extra_tab_type = "ckp";
                    break;
                case "lora":
                    active_extra_tab_type = "lora";
                    break;
            }


            for (const js_model_type of model_type_list) {
                //get model_type for python side
                switch (js_model_type) {
                    case "textual_inversion":
                        model_type = "ti";
                        break;
                    case "hypernetworks":
                        model_type = "hyper";
                        break;
                    case "checkpoints":
                        model_type = "ckp";
                        break;
                    case "lora":
                        model_type = "lora";
                        break;
                }

                if (!model_type) {
                    console.log("can not get model_type from: " + js_model_type);
                    continue;
                }


                //only handle current sub-tab
                if (model_type != active_extra_tab_type) {
                    continue;
                }

                console.log("handle active extra tab");


                extra_network_id = tab_prefix+"_"+js_model_type+"_"+cardid_suffix;
                // console.log("searching extra_network_node: " + extra_network_id);
                extra_network_node = gradioApp().getElementById(extra_network_id);

                // console.log("find extra_network_node: " + extra_network_id);

                // get all card nodes
                cards = extra_network_node.querySelectorAll(".card");
                for (let card of cards) {
                    //get button row
                    button_row = card.querySelector(".button-row");
                    
                    if (!button_row){
                        console.log("can not find button_row");
                        continue;
                    }

                    let atags = button_row.querySelectorAll("a");
                    if (atags && atags.length) {
                        console.log("find atags: " + atags.length);
                    } else {
                        console.log("no atags");
                        need_to_add_buttons = true;
                    }

                    if (!need_to_add_buttons) {
                        console.log("do not need to add buttons");
                        continue;
                    }


                    // search_term node
                    // search_term = subfolder path + model name + ext
                    search_term_node = card.querySelector(".actions .additional .search_term");
                    if (!search_term_node){
                        console.log("can not find search_term node for cards in " + extra_network_id);
                        continue;
                    }

                    // get search_term
                    search_term = search_term_node.innerHTML.trim();
                    if (!search_term) {
                        console.log("search_term is empty for cards in " + extra_network_id);
                        continue;
                    }

                    console.log("adding buttons");
                    // then we need to add 3 buttons to each ul node:
                    let open_url_node = document.createElement("a");
                    open_url_node.href = "#";
                    open_url_node.innerHTML = "🌐";
                    open_url_node.className = "card-button";

                    open_url_node.title = "Open this model's civitai url";
                    open_url_node.setAttribute("onclick","open_model_url(event, '"+model_type+"', '"+search_term+"')");

                    let add_trigger_words_node = document.createElement("a");
                    add_trigger_words_node.href = "#";
                    add_trigger_words_node.innerHTML = "💡";
                    add_trigger_words_node.className = "card-button";

                    add_trigger_words_node.title = "Add trigger words to prompt";
                    add_trigger_words_node.setAttribute("onclick","add_trigger_words(event, '"+model_type+"', '"+search_term+"')");

                    let use_preview_prompt_node = document.createElement("a");
                    use_preview_prompt_node.href = "#";
                    use_preview_prompt_node.innerHTML = "🏷️";
                    use_preview_prompt_node.className = "card-button";

                    use_preview_prompt_node.title = "Use prompt from preview image";
                    use_preview_prompt_node.setAttribute("onclick","use_preview_prompt(event, '"+model_type+"', '"+search_term+"')");

                    let remove_card_node = document.createElement("a");
                    remove_card_node.href = "#";
                    remove_card_node.innerHTML = "❌";
                    remove_card_node.className = "card-button";

                    remove_card_node.title = "Remove this model";
                    remove_card_node.setAttribute("onclick","remove_card(event, '"+model_type+"', '"+search_term+"')");

                    let open_filepath_node = document.createElement("a");
                    open_filepath_node.href = "#";
                    open_filepath_node.innerHTML = "📁";
                    open_filepath_node.className = "card-button";

                    open_filepath_node.title = "Open model path in File Explorer";
                    open_filepath_node.setAttribute("onclick", "open_filepath(event, '" + model_type + "', '" + search_term + "')");

                    //add to card
                    button_row.appendChild(open_url_node);
                    button_row.appendChild(add_trigger_words_node);
                    button_row.appendChild(use_preview_prompt_node);
                    button_row.appendChild(remove_card_node);
                    button_row.appendChild(open_filepath_node);




                }

                
            }
        }


    }


    let tab_id = ""
    let extra_tab = null;
    let extra_toolbar = null;
    let extra_network_refresh_btn = null;
    //add refresh button to extra network's toolbar
    for (let prefix of tab_prefix_list) {
        tab_id = prefix + "_extra_tabs";
        extra_tab = gradioApp().getElementById(tab_id);

        //get toolbar
        //get Refresh button
        extra_network_refresh_btn = gradioApp().getElementById(prefix+"_extra_refresh");


        if (!extra_network_refresh_btn){
            console.log("can not get extra network refresh button for " + tab_id);
            continue;
        }

        // add refresh button to toolbar
        let ch_refresh = document.createElement("button");
        ch_refresh.innerHTML = "🔁";
        ch_refresh.title = "Refresh Civitai Helper's additional buttons";
        ch_refresh.className = "lg secondary gradio-button";
        ch_refresh.style.fontSize = "200%";
        ch_refresh.onclick = update_card_for_civitai;

        extra_network_refresh_btn.parentNode.appendChild(ch_refresh);

    }


    //run it once
    update_card_for_civitai();


});



