$(function() {
    const defaultOptions = {duration: 4000, showClose: true, showProgress: true, position: 'top-right'};
    let countdownInterval = null, remainingTime = 0;
    const iconMap = {success: '✓', error: '✕', warning: '⚠', info: 'ℹ'};

    $("#mobile-menu").click(function() {
        var $this = $(this);
        var $nav = $("#mobile-nav");
        var isExpanded = $this.attr('aria-expanded') === 'true';
        $nav.toggleClass("active");
        $this.attr('aria-expanded', !isExpanded);
    });

    $(".accordion-header").click(function(e) {
        var $this = $(this);
        if ($this.hasClass('accordion-header') && $this.children('a').length === 0) {
            var isExpanded = $this.attr('aria-expanded') === 'true';
            var $content = $this.next(".accordion-content");
            $this.toggleClass("active").attr('aria-expanded', !isExpanded);
            $content.toggleClass("active");
            $(".accordion-header").not($this).removeClass("active").attr('aria-expanded', 'false');
            $(".accordion-content").not($content).removeClass("active");
        }
    });

    $(".category-item").click(function() {
        var $this = $(this);
        $(".category-item").removeClass("active").attr('aria-selected', 'false');
        $this.addClass("active").attr('aria-selected', 'true');
        if($this.attr('id') === 'cid-0'){
            $('.product-item').show();
        }else{
            $('.product-item').hide();
            $('.product-item.'+ $this.attr('id')).show();
        }
    });

    $(".category-item, .accordion-header, .faq-question").on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
        }
    });

    $(".faq-question").click(function() {
        var $this = $(this);
        var $answer = $this.next(".faq-answer");
        var isExpanded = $this.attr('aria-expanded') === 'true';
        $this.toggleClass("active").attr('aria-expanded', !isExpanded);
        $answer.toggleClass("active");
    });

    // 滚动时高亮导航项和回到顶部按钮
    $(window).scroll(function() {
        var scrollDistance = $(window).scrollTop();
        if (scrollDistance > 300) {
            $("#back-to-top").fadeIn();
        } else {
            $("#back-to-top").fadeOut();
        }

        $('section[id]').each(function() {
            var $section = $(this);
            var sectionTop = $section.offset().top - 100;
            var sectionBottom = sectionTop + $section.outerHeight();
            if (scrollDistance >= sectionTop && scrollDistance < sectionBottom) {
                var sectionId = $section.attr('id');
                $('.nav-links a').removeClass('active');
                $('.nav-links a[href="#' + sectionId + '"]').addClass('active');
            }
        });
    });

    $("#back-to-top").click(function() {
        $('html, body').animate({
            scrollTop: 0
        }, 800);
    });

    var scrollTimer = null;
    $(window).on('scroll', function() {
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        scrollTimer = setTimeout(function() {
        }, 16);
    });

    function createToast(type, title, message, options) {
        const opts = $.extend({}, defaultOptions, options);
        const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const toastHtml = `<div class="toast ${type}"id="${toastId}"><div class="toast-icon">${iconMap[type] || iconMap.info}</div><div class="toast-content">${title ? `<div class="toast-title">${title}</div>` : ''}<div class="toast-message">${message}</div></div>${opts.showClose ? '<button class="toast-close" onclick="closeToast(\'' + toastId + '\')">&times;</button>' : ''}${opts.showProgress ? `<div class="toast-progress"style="animation-duration: ${opts.duration}ms;"></div>` : ''}</div>`;
        return {id: toastId, html: toastHtml, duration: opts.duration}
    }

    function toast(type, title, message, options) {
        const toast = createToast(type, title, message, options);
        const $container = $('#toastContainer');
        if ($container.length === 0) {
            $('body').append('<div class="toast-container" id="toastContainer"></div>');
        }
        $('#toastContainer').append(toast.html);
        const $toast = $('#' + toast.id);
        setTimeout(() => {
            $toast.addClass('show');
        }, 10);
        if (toast.duration > 0) {
            setTimeout(() => {
                closeToast(toast.id);
            }, toast.duration);
        }
        return toast.id;
    }

    window.closeToast = function (toastId) {
        const $toast = $('#' + toastId);
        if ($toast.length) {
            $toast.removeClass('show');
            setTimeout(() => {
                $toast.remove();
            }, 300);
        }
    };

    // 数量增减控制
    $('#decrease').click(function() {
        var quantity = parseInt($('#quantity').val());
        if (quantity > 1) {
            $('#quantity').val(quantity - 1);
            updateSummary();
        }
    });

    $('#increase').click(function() {
        var quantity = parseInt($('#quantity').val());
        if (quantity < 10) {
            $('#quantity').val(quantity + 1);
            updateSummary();
        }
    });

    $('#quantity').change(function() {
        var quantity = parseInt($(this).val());
        if (isNaN(quantity) || quantity < 1) {
            $(this).val(1);
        } else if (quantity > 1000) {
            $(this).val(1000);
        }
        updateSummary();
    });

    // 更新订单摘要
    function updateSummary() {
        var quantity = parseInt($('#quantity').val()),
            priceEle = $('#summary-price'),
            price = parseFloat(priceEle.attr('data-price')),
            total = quantity * price;

        $('#summary-name').text($('.product-d-title').text());
        $('#summary-quantity').text(quantity);
        priceEle.text('$' + price.toFixed(2));
        $('#total-price').text('$' + total.toFixed(2));
    }

    // 打开购买模态框
    $('#buy-now').click(function() {
        var email = $('.form-input[type="email"]').val();
        if (!email || !isValidEmail(email)) {
            toast('error', '', '请输入有效的邮箱地址');
            return;
        }
        updateSummary();
        updatePaymentAddress('usdt-trc20');
        $('#purchase-modal').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // 关闭模态框
    $('#close-modal, .modal-overlay').click(function(e) {
        if (e.target === this) {
            $('#purchase-modal').removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });

    // 选择支付方式
    $('.payment-option').click(function() {
        $('.payment-option').removeClass('selected');
        $(this).addClass('selected');
        var method = $(this).data('method');
        updatePaymentAddress(method);
        $('.address-container').addClass('fade-in');
        setTimeout(() => {
            $('.address-container').removeClass('fade-in');
        }, 500);
    });

    // 更新支付地址
    function updatePaymentAddress(method) {
        var addresses = {
            'usdt-trc20': 'TYeq7iySqodh89rEasB2u6tKfM3nHgyXkP',
            'usdt-erc20': '0x8a7d7a2c3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
            'usdt-bep20': '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            'usdt-sol': 'So1AaaBBbCCccDDddEEeeFFffGGggHHhhIIiiJJjj'
        };

        $('#payment-address').text(addresses[method]);
        $('#desktop-qrcode').empty();
        new QRCode('desktop-qrcode', {
            text: addresses[method],
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        $('#mobile-qrcode').empty();
        new QRCode('mobile-qrcode', {
            text: addresses[method],
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        var copyBtn = $('#copy-btn');
        copyBtn.show();
        copyBtn.attr('data-clipboard-text', addresses[method]);
    }

    if(typeof ClipboardJS !== 'undefined'){
        var clipboard = new ClipboardJS('#copy-btn');
        clipboard.on('success', function (e) {
            toast('success', '', '复制成功');
            e.clearSelection();
        })
    }

    function isValidEmail(email) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // 键盘事件
    $(document).keydown(function(e) {
        if (e.keyCode === 27) { // ESC键
            $('#purchase-modal').removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });
});

$(window).on('load', function() {
    $('body').removeClass('loading');
});
