const APP_NAME = 'MP';

const WEBAUTH_URL = 'https://www.partymember.cn/hongan/webauth/';
const WEB_ROOT = 'https://www.partymember.cn/hongan/api/';

$(document).ready(function () {
    FastClick.attach(document.body);

    initAll();
});

function onBridgeReady() {
    WeixinJSBridge.call('hideOptionMenu');
}

function is_weixn() {
    var ua = navigator.userAgent.toLowerCase();
    var isWeixin = ua.indexOf('micromessenger') != -1;
    if (isWeixin) {
        return true;
    } else {
        return false;
    }
}

function getParameter(param) {
    var query = window.location.search;//获取URL地址中？后的所有字符
    var iLen = param.length;//获取你的参数名称长度
    var iStart = query.indexOf(param);//获取你该参数名称的其实索引
    if (iStart == -1)//-1为没有该参数
        return "";
    iStart += iLen + 1;
    var iEnd = query.indexOf("&", iStart);//获取第二个参数的其实索引
    if (iEnd == -1)//只有一个参数
        return query.substring(iStart);//获取单个参数的参数值
    return query.substring(iStart, iEnd);//获取第二个参数的值
}

function createSafeParameter(jsonobj) {
    var openid = $("#wx_openid").val();
    var ts = getTimestamp();
    var sign = $.md5(APP_NAME + ts + '#wx_openid' + openid).toLowerCase();

    var safejson = {
        "appid": openid,
        "ts": ts,
        "sign": sign
    };

    // console.log(JSON.parse(JSON.stringify(Object.assign(safejson, jsonobj))));

    return JSON.parse(JSON.stringify(Object.assign(safejson, jsonobj)));
}

function checkWxUrl(openid, ts) {
    // 非法打开
    if (!is_weixn()) {
        $.toast("请在公众号打开!", "forbidden");

        document.write("<script>window.location.href='./welcome.html?code=2030';</script>");
        return;
    }

    // $.ajax({
    //     "url": WEBAUTH_URL + '?id=' + openid + '&ts=' + ts,
    //     "type": "GET",
    //     success: function (data) {
    //         if (data != 1) {
    //             console.log(data);
    //             $.toast("会话失效,请重新在公众号中打开!", "forbidden");

    //             document.write("<script>window.location.href='./welcome.html?code=2030';</script>");
    //             return;
    //         }
    //     },
    //     error: function (e) {
    //         console.log(e);
    //         document.write("<script>window.location.href='./welcome.html?code=2030';</script>");
    //         return;
    //     }
    // });

    // // 禁止微信分享和转发
    // if (typeof WeixinJSBridge == "undefined") {
    //     if (document.addEventListener) {
    //         document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
    //     } else if (document.attachEvent) {
    //         document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
    //         document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
    //     }
    // } else {
    //     onBridgeReady();
    // }
}

function initAll() {
    showAllInput(false);

    // 限制所有弹出式对话框最大高度
    $(".popup_body").css({ "max-height": document.body.clientHeight - 100, "overflow": "scroll" });

    $.base64.utf8encode = true;

    var openid = getParameter("a");
    var wxauthts = getParameter("b");
    var jsonbase64 = getParameter("c");
    var jsonuserinfo = decode_base64(jsonbase64);

    // 验证此URL是否有效
    checkWxUrl(openid, wxauthts);

    $("#partymember_userid").val("");
    $("#wx_openid").val(openid);
    $("#wx_userinfo").val(jsonuserinfo);

    var wx_userobj = JSON.parse(JSON.parse(jsonuserinfo));
    // $("#partymember_headimgurl").attr('src', wx_userobj.headimgurl);

    // 数据提交
    $("#btn_post_bindwx").click(function () {
        if ($("#wx_openid").val().trim().length == 0) {
            $.toast('数据异常,请重新进入!!', "forbidden");
            return;
        }

        if ($("#partymember_usertel").val().trim().length == 0) {
            $.toast('手机不能为空!!', "forbidden");
            return;
        }
        if (!(/^1[3456789]\d{9}$/.test($("#partymember_usertel").val().trim()))) {
            $.toast("手机号码有误", "text");
            return;
        }
        if ($("#partymember_loginpwd").val().trim().length == 0) {
            $.toast('APP密码不能为空!!', "forbidden");
            return;
        }

        // 先关闭按钮，防止重复点击
        $("#btn_post_bindwx").hide();

        var param = {
            "wxid": $('#wx_openid').val().trim(),
            "lng": $('#lng').val().trim(),
            "lat": $('#lat').val().trim(),
            "info": $('#wx_userinfo').val().trim(),
            "tel": $('#partymember_usertel').val().trim(),
            "pwd": $.md5($('#partymember_loginpwd').val().trim())
        };

        ajax_post(
            'partybindwx',
            param,
            function (data) {
                if (data.success) {
                    showAllInput(false);
                } else {
                    $.notification({
                        title: "提交失败",
                        text: data.msg
                    });
                }
                $("#btn_post_bindwx").show();
            },
            function (e) {
                console.error(e);
                $.toast('提交异常!', "cancel");
                $("#btn_post_bindwx").show();
            }
        );

    });

    // 清空
    clearAllInput();

    // 查询
    var param = {
        "wxid": $('#wx_openid').val().trim(),
        "info": $('#wx_userinfo').val().trim(),
        "name": '',
        "tel": ''
    };

    ajax_post(
        'partyquerywx',
        param,
        function (data) {
            // console.log(JSON.stringify(data));
            if (data.success) {
                var vo = data.data;
                // 已经绑定
                showAllInput(false);

                // 设置值
                $("#partymember_userid").val(vo.id);
                $("#partymember_usertel").val(vo.userTel);

                $("#show_text").html("恭喜 " + hideStr(vo.userName, 1, 0) + "(" + hideStr(vo.userTel, 3, 3) + "),<br/>您已经开通微信消息接收!<br/><br/><span style='color:#ccc'>若需关闭，可在APP中解绑!</span>");
            } else {
                showAllInput(true);
            }
        },
        function (e) {
            console.error(e);
        }
    );
}

function hideStr(str, frontLen, endLen) {
    var len = str.length - frontLen - endLen;
    var xing = '';
    for (var i = 0; i < len; i++) {
        xing += '*';
    }
    return str.substring(0, frontLen) + xing + str.substring(str.length - endLen);
}

function clearAllInput() {
    $("#partymember_usertel").val("");
    $("#partymember_loginpwd").val("");
    showAllInput(true);
}

function showAllInput(on) {
    if (on) {
        $("#show_icon").removeClass("weui-icon-success").addClass("weui-icon-info");
        $("#show_text").text("");
        $("#btn_show_popup").show();
    } else {
        $("#show_icon").removeClass("weui-icon-info").addClass("weui-icon-success");
        $("#show_text").text("您已开通微信消息接收!");
        $("#btn_show_popup").hide();
    }
}

function getTimestamp() {
    return new Date().getTime(); // 13位毫秒数
}

function formatTimestamp(timestamp) {
    return (new Date(timestamp)).format("yyyy-MM-dd hh:mm:ss");
}

function encode_base64(val) {
    $.base64.utf8encode = true;
    return $.base64.btoa(val);
}

function decode_base64(val) {
    $.base64.utf8encode = true;
    return $.base64.atob(val, true);
}

function getGUID() {
    // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    //     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    //     return v.toString(16);
    // });
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isEmpty(v) {
    switch (typeof v) {
        case 'undefined':
            return true;
        case 'string':
            if (v.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, '').length == 0) return true;
            break;
        case 'boolean':
            if (!v) return true;
            break;
        case 'number':
            if (0 === v || isNaN(v)) return true;
            break;
        case 'object':
            if (null === v || v.length === 0) return true;
            for (var i in v) {
                return false;
            }
            return true;
    }

    if ('null' === v) return true;

    return false;
}

function ajax_post(url, param, onsucess, onerror) {
    $.ajax({
        "url": WEB_ROOT + url,
        "data": createSafeParameter(param),
        "type": "POST",
        "dataType": "json",
        "Content-Type": "application/json; charset=utf-8",
        success: onsucess,
        error: onerror
    });
}
