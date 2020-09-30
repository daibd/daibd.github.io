const APP_NAME = 'MP';
const IMG_ROOT = 'https://www.partymember.cn/hongan/homeimg/';
const WEBAUTH_URL = 'https://www.partymember.cn/hongan/webauth/';
const WEB_ROOT = 'https://www.partymember.cn/hongan/api/';

$(document).ready(function () {
    FastClick.attach(document.body);

    initAll();

    initTab1();
    initTab2();
    initTab3();

    initTabOnClickEvent();
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

var TabTitleBodyViewModel = function () {
    this.badge2 = ko.observable(0);
    this.badge3 = ko.observable(0);
};
var tabTitleBodyViewModel = new TabTitleBodyViewModel();

function checkWxUrl(openid, ts) {
    // 非法打开
    if (!is_weixn()) {
        $.toast("请在公众号打开!", "forbidden");

        document.write("<script>window.location.href='./welcome.html?code=2020';</script>");
        return;
    }

    // $.ajax({
    //     "url": WEBAUTH_URL + '?id=' + openid + '&ts=' + ts,
    //     "type": "GET",
    //     success: function (data) {
    //         if (data != 1) {
    //             console.log(data);
    //             $.toast("会话失效,请重新在公众号中打开!", "forbidden");

    //             document.write("<script>window.location.href='./welcome.html?code=2020';</script>");
    //             return;
    //         }
    //     },
    //     error: function (e) {
    //         console.log(e);
    //         document.write("<script>window.location.href='./welcome.html?code=2020';</script>");
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

function initTabOnClickEvent() {
    // 点击tab刷新
    $(document).on("click", ".weui-navbar__item, .weui-tabbar__item", function (e) {
        // tab2刷新
        tab2BodyViewModel.datalist.removeAll();
        tabTitleBodyViewModel.badge2(0);
        tab2_querylist(1);

        // tab3刷新
        tab3BodyViewModel.datalist.removeAll();
        tabTitleBodyViewModel.badge3(0);
        tab3_querylist(1);
    });
}

function initAll() {
    // 内容
    ko.applyBindings(tabTitleBodyViewModel, document.getElementById("tabTitleBodyViewModel"));

    // 限制所有弹出式对话框最大高度
    $(".popup_body").css({ "max-height": document.body.clientHeight - 100, "overflow": "scroll" });

    $.base64.utf8encode = true;

    var openid = getParameter("a");
    var wxauthts = getParameter("b");
    var jsonbase64 = getParameter("c");
    var jsonuserinfo = decode_base64(jsonbase64);

    // 验证此URL是否有效
    checkWxUrl(openid, wxauthts);

    $("#masses_userid").val("");
    $("#wx_openid").val(openid);
    $("#wx_userinfo").val(jsonuserinfo);

    // 查询
    var param = {
        "wxid": $('#wx_openid').val().trim(),
        "info": $('#wx_userinfo').val().trim(),
        "name": $('#masses_username').val().trim(),
        "tel": $('#masses_usertel').val().trim()
    };

    ajax_post(
        'querywx',
        param,
        function (data) {
            // console.log(JSON.stringify(data));
            if (data.success) {
                $("#masses_userid").val(data.data.uid);
                $("#masses_username").val(data.data.name);
                $("#masses_usertel").val(data.data.tel);
                var dataorgs = data.data.orgs;
                console.log(dataorgs);

                if (!isEmpty(dataorgs)) {
                    var orgids = dataorgs.split(" ");
                    if (!isEmpty(orgids)) {
                        if (orgids.length == 2) {
                            if ((!isEmpty(orgids[0])) && (!isEmpty(orgids[1]))) {
                                $("#masses_orgid").val(orgids[0] + ' ' + orgids[1]);
                            }
                        }
                    }
                }

                $("#btn_masses_userinfo").text('更新实名');
                $("#btn_masses_userinfo").removeClass('weui-btn_warn');
                $("#btn_masses_userinfo").addClass('weui-btn_default');
            } else {
                $("#btn_masses_userinfo").text('实名绑定');
                $("#btn_masses_userinfo").removeClass('weui-btn_default');
                $("#btn_masses_userinfo").addClass('weui-btn_warn');
            }
        },
        function (e) {
            console.error(e);
        }
    );

}

function clearContent() {
    $("#masses_content").val("");
    $('#masses_content_wordcount').text("0");

    var list_files = $("#uploaderFiles").find("li");
    for (var i = 0; i < list_files.length; i++) {
        list_files.get(i).remove();
    }
    $('#uploadCount').text("0");
}

function initUploadFiles() {
    if (typeof FileReader == 'undefined') {
        $.toast('此手机禁止上传', "forbidden");
        return;
    }

    // 允许上传的图片类型
    var allowTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
    var maxSize = 1024 * 1024 * 10; // 10240KB，也就是 10MB
    var maxWidth = 1900;  // 图片最大宽度
    var maxCount = 2; // 最大上传图片数量

    //
    var tmpl = '<li class="weui-uploader__file" id="#ImgID#" style="background-image:url(#url#);"><div class="weui_uploader_status_content" style="width: 100%;height: 100%;display:flex;align-items: center;justify-content: center;color:#ffffff;background-color:#80999999">0%</div></li>',
        $gallery = $("#gallery"),
        $galleryImg = $("#galleryImg"),
        $uploaderInput = $("#uploaderInput"),
        $uploaderFiles = $("#uploaderFiles");

    $uploaderInput.on("change", function (e) {
        files = e.target.files;
        // 如果没有选中文件，直接返回
        if (files.length === 0) {
            return;
        }

        for (var i = 0, len = files.length; i < len; ++i) {
            var file = files[i];
            var imgID = file.name; // getGUID();
            var reader = new FileReader();

            var fileType = file.type;
            fileType = fileType.toLowerCase();

            // 如果类型不在允许的类型范围内
            if (allowTypes.indexOf(fileType) === -1) {
                $.toast('只能传图片' + fileType, "forbidden");
                continue;
            }

            if (file.size > maxSize) {
                $.toast("图片太大", "forbidden");
                continue;
            }

            if ($('#tab1 .weui-uploader__file').length >= maxCount) {
                $.toast('只能上传' + maxCount + '张', "forbidden");
                return;
            }

            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    // 不要超出最大宽度
                    var w = Math.min(maxWidth, img.width);
                    // 高度按比例计算
                    var h = img.height * (w / img.width);
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    // 设置 canvas 的宽度和高度
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    var base64 = canvas.toDataURL(fileType, 0.6); //0.6指的是压缩60%

                    // 插入到预览区
                    $uploaderFiles.append($(tmpl.replace('#url#', base64).replace('#ImgID#', imgID)));

                    var num = $('#tab1 .weui-uploader__file').length;
                    $('#uploadCount').text(num);

                    // 模拟上传进度
                    var progress = 0;
                    function uploading() {
                        $uploaderFiles.find('.weui_uploader_status_content').text(++progress + '%');
                        if (progress < 100) {
                            setTimeout(uploading, 10);
                        } else {
                            $uploaderFiles.removeClass('weui_uploader_status').find('.weui_uploader_status_content').remove();//清除上传进度图标
                        }
                    }
                    setTimeout(uploading, 10);
                };

                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    var index; //第几张图片
    $uploaderFiles.on("click", "li", function () {
        index = $(this).index();
        $galleryImg.attr("style", this.getAttribute("style"));
        $gallery.fadeIn(100);
    });
    $gallery.on("click", function () {
        $gallery.fadeOut(100);
    });

    //删除图片
    $("#tab1 .weui-gallery__del").click(function () {
        $uploaderFiles.find("li").eq(index).remove();
        var num = $('#tab1 .weui-uploader__file').length;
        $('#uploadCount').text(num);
    });
}

function format_imgstr(str) {
    return str.replace("background-image:url(data:image/jpeg;base64,", "")
        .replace("background-image:url(data:image/jpg;base64,", "")
        .replace("background-image:url(data:image/png;base64,", "")
        .replace("background-image:url(data:image/gif;base64,", "")
        .replace(");", "");
}

function initTab1() {
    clearContent();
    initUploadFiles();

    $("#masses_type").picker({
        title: "请选择类型",
        cols: [
            {
                textAlign: 'center',
                values: all_type
            }
        ],
        onChange: function (p, v, dv) {
            //console.log(p, v, dv);
        },
        onClose: function (p, v, d) {
            //console.log("close");
        }
    });

    $("#masses_orgid").cityPicker({
        title: "请选择服务阵地",
        showDistrict: false,
        onChange: function (picker, values, displayValues) {
            //console.log(values, displayValues);
        }
    });

    $("#btn_masses_userinfo").click(function () {
        if ($("#masses_username").val().trim().length == 0) {
            $.toast('姓名不能为空!!', "forbidden");
            return;
        }
        if ($("#masses_usertel").val().trim().length == 0) {
            $.toast('手机不能为空!!', "forbidden");
            return;
        }

        var inputtel = $("#masses_usertel").val().trim();
        $.prompt({
            title: $("#btn_masses_userinfo").text(),
            text: '请输入手机号码确认',
            input: '',
            empty: false, // 是否允许为空
            onOK: function (input) {
                // 先关闭按钮，防止重复点击
                if (inputtel != input) {
                    $.toast('手机号码不一致!', "cancel");
                    return;
                }

                $("#btn_masses_userinfo").hide();

                var param = {
                    "wxid": $('#wx_openid').val().trim(),
                    "info": $('#wx_userinfo').val().trim(),
                    "name": $('#masses_username').val().trim(),
                    "tel": $('#masses_usertel').val().trim()
                };

                ajax_post(
                    'bindwx',
                    param,
                    function (data) {
                        if (data.success) {
                            $.notification({
                                title: "提示",
                                text: data.msg,
                                data: $('#wx_openid').val().trim(),
                                onClick: function (data) {
                                },
                                onClose: function (data) {
                                }
                            });
                        } else {
                            $.notification({
                                title: $("#btn_masses_userinfo").text() + "提交失败",
                                text: data.msg
                            });
                        }
                        $("#btn_masses_userinfo").show();
                    },
                    function (e) {
                        console.error(e);
                        $.toast('提交异常!', "cancel");
                        $("#btn_masses_userinfo").show();
                    }
                );
            },
            onCancel: function () {
                $.toast('取消了' + $("#btn_masses_userinfo").text(), "cancel");
            }
        });

    });

    // 绑定字数统计
    const max = 1000;
    $('#masses_content').on('input', function () {
        var text = $(this).val();
        var len = text.length;
        $('#masses_content_wordcount').text(len);
        if (len > max) {
            $(this).closest('.weui_cell').addClass('weui_cell_warn');
        }
        else {
            $(this).closest('.weui_cell').removeClass('weui_cell_warn');
        }
    });

    // 同意勾选框
    $("#masses_agree_checkbox").change(function () {
        var ischecked = $(this).prop("checked");
        if (ischecked) {
            $("#btn_post_content").show();
        } else {
            $("#btn_post_content").hide();
        }
    });

    // 数据提交
    $("#btn_post_content").click(function () {
        if ($("#wx_openid").val().trim().length == 0) {
            $.toast('请先实名绑定!!', "forbidden");
            return;
        }
        if ($("#masses_username").val().trim().length == 0) {
            $.toast('姓名不能为空!!', "forbidden");
            return;
        }
        if ($("#masses_usertel").val().trim().length == 0) {
            $.toast('手机不能为空!!', "forbidden");
            return;
        }
        if (!(/^1[3456789]\d{9}$/.test($("#masses_usertel").val().trim()))) {
            $.toast("手机号码有误", "text");
            return;
        }
        if ($("#masses_type").val().trim().length == 0) {
            $.toast('类型不能为空!!', "forbidden");
            return;
        }
        if ($("#masses_orgid").val().trim().length == 0) {
            $.toast('小区不能为空!!', "forbidden");
            return;
        }
        if ($("#masses_content").val().trim().length == 0) {
            $.toast('内容不能为空!!', "forbidden");
            return;
        }

        $.confirm({
            title: '提示',
            text: '请确认是否提交?',
            onOK: function () {
                // 先关闭按钮，防止重复点击
                $("#btn_post_content").hide();

                //点击确认
                var img1name = "";
                var img1str = "";
                var img2name = "";
                var img2str = "";
                // 图片
                var list_files = $("#uploaderFiles").find("li");
                for (var i = 0; i < list_files.length; i++) {
                    if (0 == i) {
                        img1name = list_files.get(i).getAttribute("id");
                        img1str = list_files.get(i).getAttribute("style");
                    }
                    if (1 == i) {
                        img2name = list_files.get(i).getAttribute("id");
                        img2str = list_files.get(i).getAttribute("style");
                    }
                }

                var param = {
                    "uid": $('#masses_userid').val().trim(),
                    "wxid": $('#wx_openid').val().trim(),
                    "name": $('#masses_username').val().trim(),
                    "tel": $('#masses_usertel').val().trim(),
                    "info": $('#wx_userinfo').val().trim(),
                    "type": $('#masses_type').val().trim(),
                    "lng": $('#lng').val().trim(),
                    "lat": $('#lat').val().trim(),
                    "orgid": $('#masses_orgid').val().trim(),
                    "content": $('#masses_content').val().trim(),
                    "img1name": img1name,
                    "img1str": format_imgstr(img1str),
                    "img2name": img2name,
                    "img2str": format_imgstr(img2str)
                };

                ajax_post(
                    'sendtext',
                    param,
                    function (data) {
                        if (data.success) {
                            clearContent();

                            // 同步更新查询
                            $('#tab2').pullToRefresh('triggerPullToRefresh');

                            $.toast(data.msg);
                        } else {
                            $.notification({
                                title: "提交失败",
                                text: data.msg
                            });
                        }
                        $("#btn_post_content").show();
                    },
                    function (e) {
                        console.error(e);
                        $.toast('提交异常!', "cancel");
                        $("#btn_post_content").show();
                    }
                );
            },
            onCancel: function () {
                // $.toast('取消了提交!', "cancel");
            }
        });

    });

    //
}

function getTotPage(totalcount, pagesize) {
    return parseInt((totalcount + pagesize - 1) / pagesize);
}

var tab2var = {
    curpage: 1,
    totpage: 1,
    pagesize: 5,
    loading: false
}

function initTab2() {
    // 内容
    ko.applyBindings(tab2BodyViewModel, document.getElementById("tab2BodyView"));

    // 下拉
    $('#tab2').pullToRefresh().on('pull-to-refresh', function (done) {
        var self = this
        setTimeout(function () {
            tab2BodyViewModel.datalist.removeAll();
            tabTitleBodyViewModel.badge2(0);
            tab2_querylist(1);

            $(self).pullToRefreshDone();
        }, 2000)
    });

    // 下拉
    $("#tab2").infinite().on("infinite", function () {
        if (tab2var.loading) return;
        tab2var.loading = true;

        tab2var.curpage++;
        if (parseInt(tab2var.curpage) <= parseInt(tab2var.totpage)) {
            tab2_querylist(tab2var.curpage);
        } else {
            tab2var.curpage--;
            $("#tab2").destroyInfinite();
            $("#tab2 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>数据已加载完毕!</span></div>");
        }
    });

    // 初始加载
    tab2_querylist(1);
}

var Tab2BodyViewModel = function () {
    this.datalist = ko.observableArray();
};
var tab2BodyViewModel = new Tab2BodyViewModel();

function tab2_querylist(curpage) {

    var param = {
        "wxid": $('#wx_openid').val().trim(),
        "status": "A1",
        "dateflag": 0,
        "pagenum": (curpage <= 0) ? 1 : curpage,
        "pagesize": tab2var.pagesize
    };

    tab2var.loading = true;

    ajax_post(
        'massesquery',
        param,
        function (data) {
            // console.log(data);
            if (data.success) {
                // 内容
                for (var i = 0; i < data.data.data.length; i++) {
                    tab2BodyViewModel.datalist.push(data.data.data[i]);
                }
                tabTitleBodyViewModel.badge2(parseInt(tab2BodyViewModel.datalist().length));

                tab2var.loading = false;

                // 尾部分页
                tab2var.curpage = curpage;
                tab2var.totpage = getTotPage(parseInt(data.data.total), tab2var.pagesize);

                if (tab2var.curpage <= 1) {
                    $("#tab2").destroyInfinite();
                    var msg = "暂无数据";
                    if (data.data.data.length > 0) {
                        msg = "数据已经全部加载";
                    }
                    $("#tab2 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>" + msg + "</span></div>");
                }

            } else {
                $("#tab2").destroyInfinite();
                var msg = data.msg;
                $("#tab2 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>" + msg + "</span></div>");
            }
        },
        function (e) {
            console.error(e);
        }
    );
}

function format_curstatus(cur_status, discuss_time) {
    if (cur_status == 0) {
        return "等待接单";
    } else if (cur_status == 1) {
        return "正在处理中";
    } else if (cur_status == 2) {
        if (null != discuss_time) {
            return "处理完成";
        } else {
            return "处理结束等待评分";
        }
    }
}

var tab3var = {
    curpage: 1,
    totpage: 1,
    pagesize: 5,
    loading: false
}

function initTab3() {
    // 评分显示组件
    $('#masses-discuss-score').score({
        number: 5,
        size: 36,
        color: '#fcc919',
        score: 1,
        vertical: false,
        click: function (score, event) {
            //alert('Class Name: ' + this.className + '\n' + 'Score: ' + score + '\n' + 'Event Type: ' + event.type + '\n');
        }
    });

    // 评分提交
    $("#btn_masses_discuss_post").click(function () {
        var contentid = $("#masses-discuss-contentid").val();
        if (contentid.length == 0) {
            $.toast('请先查询!!', "forbidden");
            return;
        }
        var score = $('#masses-discuss-score').score("score");

        $.confirm({
            title: '提示',
            text: '请确认是否评为 ' + score + ' 星?',
            onOK: function () {

                var param = {
                    "id": contentid,
                    "uid": $('#masses_userid').val().trim(),
                    "wxid": $('#wx_openid').val().trim(),
                    "info": $('#wx_userinfo').val().trim(),
                    "score": score,
                    "publish": 1
                };

                ajax_post(
                    'discuss',
                    param,
                    function (data) {
                        if (data.success) {
                            $.toast('谢谢鼓励!');
                            tab3BodyViewModel.datalist.removeAll();
                            tabTitleBodyViewModel.badge3(0);
                            tab3_querylist(1);

                        } else {
                            $.notification({
                                title: "服务评价提交失败",
                                text: data.msg
                            });
                        }

                        $.closePopup();
                    },
                    function (e) {
                        console.error('e');
                        $.toast('提交异常!', "cancel");

                        $.closePopup();
                    }
                );
            },
            onCancel: function () {
                $.toast('操作已取消', "cancel");
                $('tab3').pullToRefresh('triggerPullToRefresh');

                $.closePopup();
            }
        });

    });

    // 内容
    ko.applyBindings(tab3BodyViewModel, document.getElementById("tab3BodyView"));

    // 下拉
    $('#tab3').pullToRefresh().on('pull-to-refresh', function (done) {
        var self = this
        setTimeout(function () {
            tab3BodyViewModel.datalist.removeAll();
            tabTitleBodyViewModel.badge3(0);
            tab3_querylist(1);

            $(self).pullToRefreshDone();
        }, 2000)
    });

    // 下拉
    $("#tab3").infinite().on("infinite", function () {
        if (tab3var.loading) return;
        tab3var.loading = true;

        tab3var.curpage++;
        if (parseInt(tab3var.curpage) <= parseInt(tab3var.totpage)) {
            tab3_querylist(tab3var.curpage);
        } else {
            tab3var.curpage--;
            $("#tab3").destroyInfinite();
            $("#tab3 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>数据已加载完毕!</span></div>");
        }
    });

    // 初始加载
    tab3_querylist(1);
}

var Tab3BodyViewModel = function () {
    this.datalist = ko.observableArray();
};
var tab3BodyViewModel = new Tab3BodyViewModel();

function tab3_querylist(curpage) {

    var param = {
        "wxid": $('#wx_openid').val().trim(),
        "status": "A2",
        "dateflag": 0,
        "pagenum": (curpage <= 0) ? 1 : curpage,
        "pagesize": tab3var.pagesize
    };

    tab3var.loading = true;

    ajax_post(
        'massesquery',
        param,
        function (data) {
            // console.log(data);
            if (data.success) {
                // 内容
                for (var i = 0; i < data.data.data.length; i++) {
                    tab3BodyViewModel.datalist.push(data.data.data[i]);
                }
                tabTitleBodyViewModel.badge3(parseInt(tab3BodyViewModel.datalist().length));

                tab3var.loading = false;

                // 尾部分页
                tab3var.curpage = curpage;
                tab3var.totpage = getTotPage(parseInt(data.data.total), tab3var.pagesize);

                if (tab3var.curpage <= 1) {
                    $("#tab3").destroyInfinite();
                    var msg = "暂无数据";
                    if (data.data.data.length > 0) {
                        msg = "数据已经全部加载";
                    }
                    $("#tab3 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>" + msg + "</span></div>");
                }
            } else {
                $("#tab3").destroyInfinite();
                var msg = data.msg;
                $("#tab3 .weui-infinite-scroll").html("<div class='weui-loadmore weui-loadmore_line'><span class='weui-loadmore__tips'>" + msg + "</span></div>");
            }
        },
        function (e) {
            console.error(e);
        }
    );
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

function btn_masses_cancel_onclick(obj) {

    $.confirm({
        title: '提示',
        text: '请确认是否要撤单' + obj.serviceCode + '?',
        onOK: function () {
            // 先关闭按钮，防止重复点击
            $("#btn_masses_cancel").hide();

            var param = {
                "id": obj.id,
                "uid": $('#masses_userid').val().trim(),
                "wxid": $('#wx_openid').val().trim(),
                "info": $('#wx_userinfo').val().trim()
            };

            ajax_post(
                'cancel',
                param,
                function (data) {
                    if (data.success) {
                        tab2BodyViewModel.datalist.removeAll();
                        tabTitleBodyViewModel.badge2(0);
                        tab2_querylist(1);
                        //$('#tab2').pullToRefresh('triggerPullToRefresh');
                    } else {
                        $.notification({
                            title: "撤单提交失败",
                            text: data.msg
                        });
                    }

                    $("#btn_masses_cancel").show();
                },
                function (e) {
                    console.error('e');
                    $.toast('提交异常!', "cancel");
                    $("#btn_masses_cancel").show();
                }
            );
        },
        onCancel: function () {
            $.toast('操作已取消', "cancel");
            $('tab2').pullToRefresh('triggerPullToRefresh');

        }
    });
}

function btn_masses_discuss_onclick(obj) {

    $("#masses-discuss-contentid").val(obj.id);
    $("#masses-discuss-title").text('请给 ' + obj.partymemberUsername + '(' + obj.partymemberUsertel + ') 的服务评星:');

    $("#dlg_servicecontent_discuss").popup();
}

function btn_masses_querydetail_onclick(obj) {
    var datas = [];

    $("#servicecontent_process_code").text('(' + obj.serviceCode + ')办理进度');

    // 1.点单
    datas.push({ title: '群众点单', status: 1, description: '[' + obj.createTime + '] 由' + obj.massesUsername + '(' + obj.massesUsertel + ') 提交成功' });

    // 2.接单
    if (isEmpty(obj.receiveTime)) {
        datas.push({ title: '党员接单', status: 0, description: '-' });
        datas.push({ title: '协助处理', status: 0, description: '-' });
        datas.push({ title: '服务评价', status: 0, description: '-' });
    } else {
        datas.push({ title: '党员接单', status: 1, description: '[' + obj.receiveTime + '] 由' + obj.partymemberUsername + '(' + obj.partymemberUsertel + ') 接单' });

        // 3.处理记录
        if (obj.detailList.length == 0) {
            datas.push({ title: '协助处理', status: 0, description: '-' });
            datas.push({ title: '服务评价', status: 0, description: '-' });
        } else {
            // 处理明细
            for (var i = 0; i < obj.detailList.length; i++) {
                var detail = obj.detailList[i];
                datas.push({ title: '协助处理', status: 1, description: '[' + detail.updateTime + '] 由' + obj.partymemberUsername + '(' + obj.partymemberUsertel + ') 协助处理: ' + detail.updateContent });
            }

            // 4.处理结束
            if (obj.curStatus < 2) {
                datas.push({ title: '处理结束', status: 0, description: '-' });
            } else {
                datas.push({ title: '处理结束', status: 1, description: '[' + obj.lastupdateTime + '] 由' + obj.partymemberUsername + '(' + obj.partymemberUsertel + ') 处理完成' });

                // 5.评分
                if (isEmpty(obj.discussTime)) {
                    datas.push({ title: '服务评价', status: 0, description: '-' });
                } else {
                    datas.push({ title: '服务评价', status: 1, description: '[' + obj.discussTime + '] 由' + obj.massesUsername + '(' + obj.massesUsertel + ') 给出服务评价: ' + obj.score + ' 星' });
                }
            }
        }
    }

    // 进度表
    const process_steps = steps({
        el: "#servicecontent_process_steps",
        data: datas,
        direction: "vertical",
        dataOrder: ["title", "line", "description"],
        dataWidth: ["100px", "0", "300px"],
        iconType: "bullets",
        space: 100,
        center: true,
        finishLine: true
    });

    $("#dlg_servicecontent_steps").popup();
}

function isImgVisible(val) {
    return !(isEmpty(val));
}

function format_ImgUrl(url) {
    if (isEmpty(url)) {
        return "";
    }

    return 'url(' + IMG_ROOT + url + ')';
}

function btn_masses_showimg_onclick(url) {

    var imgurl = IMG_ROOT + url;

    $("#servicecontent_showimg").attr("style", "background-image: url(" + imgurl + ");");
    $("#dlg_servicecontent_showimg").show();
}