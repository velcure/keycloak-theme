<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "register-commons.ftl" as registerCommons>
<#import "password-validation.ftl" as validator>
<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=true; section>
<!-- template: register.ftl -->

    <#if section = "header">
        <#if messageHeader??>
            ${msg(messageHeader)}
        <#else>
            ${msg("registerTitle")}
        </#if>
    <#elseif section = "form">
        <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post" novalidate="novalidate">
            <@userProfileCommons.userProfileFormFields; callback, attribute>
                <#if callback = "afterField">
                <#-- render password fields just under the username or email (if used as username) -->
                    <#if passwordRequired?? && (attribute.name == 'username' || (attribute.name == 'email' && realm.registrationEmailAsUsername))>
                        <@field.password name="password" required=true label=msg("password") autocomplete="new-password" />
                        <@field.password name="password-confirm" required=true label=msg("passwordConfirm") autocomplete="new-password" />
                    </#if>
                </#if>
            </@userProfileCommons.userProfileFormFields>

            <@registerCommons.termsAcceptance/>

            <#if recaptchaRequired?? && (recaptchaVisible!false)>
                <div class="form-group">
                    <div class="${properties.kcInputWrapperClass!}">
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
                    </div>
                </div>
            </#if>

            <p class="vc-register-notice">${msg("velcurePrivacyBefore", msg("doRegister"))} <a href="https://www.velcure.de/datenschutz" target="_blank" rel="noopener noreferrer">${msg("velcurePrivacyLink")}</a>${msg("velcurePrivacyAfter")}</p>

            <#if recaptchaRequired?? && !(recaptchaVisible!false)>
                <script>
                    function onSubmitRecaptcha(token) {
                        document.getElementById("kc-register-form").requestSubmit();
                    }
                </script>
                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!} g-recaptcha"
                            data-sitekey="${recaptchaSiteKey}" data-callback="onSubmitRecaptcha" data-action="${recaptchaAction}" type="submit" id="kc-submit">
                        ${msg("doRegister")}
                    </button>
                </div>
            <#else>
                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegister")}"/>
                </div>
            </#if>

            <div class="${properties.kcFormGroupClass!} pf-v5-c-login__main-footer-band">
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!} pf-v5-c-login__main-footer-band-item">
                    <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a href="${url.loginUrl}">${msg("backToLogin")}</a></span>
                    </div>
                </div>
            </div>

        </form>

        <@validator.templates/>
        <@validator.script field="password"/>
        <#-- An invite link opens this form with login_hint=<invited address>
             and Keycloak prefills the e-mail from it. As long as the field
             still holds that address and shows no error, it stays fixed:
             the invite only works for that address. -->
        <#if !messagesPerField.existsError('email')>
            <script>
                (function () {
                    var hint = new URLSearchParams(window.location.search).get("login_hint");
                    var email = document.querySelector('#kc-register-form input[name="email"]');
                    if (!hint || !email) return;
                    if (email.value.trim().toLowerCase() !== hint.trim().toLowerCase()) return;
                    email.readOnly = true;
                    email.closest(".pf-v5-c-form-control")?.classList.add("pf-m-readonly");
                    var note = document.createElement("p");
                    note.id = "vc-email-from-invite";
                    note.className = "vc-field-note";
                    note.textContent = "${msg("velcureEmailFromInvite")?js_string}";
                    email.setAttribute("aria-describedby",
                        ((email.getAttribute("aria-describedby") || "") + " " + note.id).trim());
                    email.closest(".pf-v5-c-form__group")?.appendChild(note);
                })();
            </script>
        </#if>
    </#if>
</@layout.registrationLayout>
