import freemarker.template.*;
import freemarker.cache.*;
import freemarker.core.HTMLOutputFormat;
import java.nio.file.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.util.*;

/** Review fixtures only. Production uses Keycloak's own models and sanitizer. */
class RenderPreviews {
    static final Path ROOT = Path.of("").toAbsolutePath();
    static Map<String,Object> map(Object... pairs) {
        Map<String,Object> result = new HashMap<>();
        for (int i=0;i<pairs.length;i+=2) result.put((String)pairs[i], pairs[i+1]);
        return result;
    }
    static TemplateMethodModelEx fn(java.util.function.Function<List,Object> action) { return args -> action.apply(args); }
    static TemplateMethodModelEx constant(Object value) { return fn(args -> value); }
    static String str(Object arg) { return arg.toString(); }
    static void load(Properties props, String file) throws Exception {
        Path path=ROOT.resolve(file);
        if(Files.exists(path)) try(Reader reader=Files.newBufferedReader(path)) { props.load(reader); }
    }
    static Map<String,Object> fixture(String type,String id,String language,String state) throws Exception {
        Properties messages=new Properties();
        load(messages,"vendor/keycloak/"+(type.equals("email")?"email":"base/login")+"/messages/messages_en.properties");
        if(language.equals("de")) {
            load(messages,"vendor/keycloak/base/"+type+"/messages/messages_de.properties");
            if(type.equals("email")) load(messages,"vendor/keycloak/keycloak/email/messages/messages_de.properties");
        }
        load(messages,"themes/velcure/"+type+"/messages/messages_"+language+".properties");
        // Realm-owned legal copy is deliberately not a Velcure default.
        messages.setProperty("termsText", language.equals("de")?"<p>Hier erscheinen die im Realm hinterlegten Nutzungsbedingungen.</p>":"<p>The terms configured by the realm appear here.</p>");
        TemplateMethodModelEx msg=fn(args -> {
            String key=str(args.get(0));
            Object[] values=new Object[args.size()-1];
            for(int i=1;i<args.size();i++) values[i-1]=str(args.get(i));
            try { return new MessageFormat(messages.getProperty(key,key),Locale.forLanguageTag(language)).format(values); }
            catch(IllegalArgumentException ex) { return messages.getProperty(key,key); }
        });
        Map<String,Object> properties=new HashMap<>();
        Properties raw=new Properties(); load(raw,"vendor/keycloak/keycloak.v2/login/theme.properties"); load(raw,"themes/velcure/"+type+"/theme.properties");
        raw.forEach((k,v)->properties.put(k.toString(),v));
        Map<String,Object> url=map();
        for(String name:List.of("loginAction","loginUrl","registrationAction","registrationUrl","loginResetCredentialsUrl","loginRestartFlowUrl","logoutConfirmAction","logoutUrl","loginUpdatePasswordUrl","loginUpdateProfileUrl","oauthAction","oauth2DeviceVerificationAction","resourcesPath","resourcesCommonPath","resourcesUrl","ssoLoginInOtherTabsUrl","loginResumeUrl","firstBrokerLoginUrl")) url.put(name,"#preview");
        url.put("resourcesPath","/theme-resources/login"); url.put("resourcesCommonPath","/theme-resources/common"); url.put("resourcesUrl","/theme-resources/email");
        var no=constant(false);var yes=constant(true);
        Map<String,Object> auth=map("showUsername",no,"showResetCredentials",no,"showTryAnotherWayLink",no,"attemptedUsername","alex@beispiel.invalid","selectedCredential","demo-otp","authenticationSelections",List.of(map("authExecId","password","iconCssClass","kcAuthenticatorPasswordClass","displayName","password-display-name","helpText","password-help-text"),map("authExecId","webauthn","iconCssClass","kcAuthenticatorWebAuthnClass","displayName","webauthn-passwordless-display-name","helpText","webauthn-passwordless-help-text")));
        var user=map("username","alex@beispiel.invalid","email","alex@beispiel.invalid","firstName","Alex","lastName","Beispiel","organizations",List.of(map("name","Velcure","alias","velcure"),map("name","Beispielbetrieb","alias","betrieb")));
        Map<String,Object> realm=map("name","velcure","displayName","Velcure","displayNameHtml","Velcure","internationalizationEnabled",true,"loginWithEmailAllowed",true,"registrationEmailAsUsername",true,"password",true,"rememberMe",true,"resetPasswordAllowed",true,"registrationAllowed",true,"registrationUsernameRequired",false,"duplicateEmailsAllowed",false,"editUsernameAllowed",true,"identityFederationEnabled",false,"isRegistrationEmailAsUsername",yes);
        List<Map<String,Object>> attrs=new ArrayList<>();
        for(String name:List.of("firstName","lastName","email")) attrs.add(map("name",name,"displayName",name,"required",true,"readOnly",false,"multivalued",false,"value",id.equals("register")?"":user.get(name),"annotations",map(),"validators",map(),"html5DataAnnotations",map(),"group",""));
        var credential=map("id","demo-otp","userLabel","Authenticator auf dem Smartphone","createdDate","21.10.2026");
        Map<String,Object> result=map(
            "lang",language,"title","Velcure","pageId",id+".ftl","darkMode",false,"ltr",true,"properties",properties,"url",url,
            "locale",map("language",language,"rtl",false,"currentLanguageTag",language,"current",language.equals("de")?"Deutsch":"English","supported",List.of(map("languageTag","de","label","Deutsch","url","?locale=de"),map("languageTag","en","label","English","url","?locale=en"))),
            "realm",realm,"auth",auth,"user",user,"login",map("username","","rememberMe",false),"register",map("formData",map()),
            "msg",msg,"advancedMsg",msg,"kcSanitize",fn(args->str(args.get(0))),
            "messagesPerField",map("existsError",fn(args->state.equals("error") && args.stream().anyMatch(a->List.of("username","password","email","totp").contains(str(a)))),"exists",constant(false),"get",constant(state.equals("error")?(id.equals("register")?messages.getProperty("emailExistsMessage"):language.equals("de")?"Bitte prüfe deine Eingabe.":"Please check your entry."):""),"printIfExists",constant(""),"getFirstError",constant(state.equals("error")?(language.equals("de")?"E-Mail-Adresse oder Passwort stimmen nicht.":"Invalid email or password."):"")),
            "profile",map("attributes",attrs,"html5DataAnnotations",map()),"passwordRequired",true,"recaptchaRequired",false,"recaptchaVisible",false,"termsAcceptanceRequired",false,"passwordPolicies",map(),
            "social",map("displayInfo",false,"providers",List.of()),"usernameHidden",false,
            "totp",map("otpCredentials",List.of(credential),"selectedCredentialId","demo-otp","supportedApplications",List.of("totpAppFreeOTPName","totpAppGoogleName","totpAppMicrosoftAuthenticatorName"),"totpSecretEncoded","JBSW Y3DP EHPK 3PXP","totpSecret","JBSWY3DPEHPK3PXP","totpSecretQrCode","otpauth://totp/Velcure:preview?secret=JBSWY3DPEHPK3PXP&issuer=Velcure","manualUrl","#manual","qrUrl","#qr","policy",map("type","totp","digits",6,"period",30,"initialCounter",0,"getAlgorithmKey",constant("HmacSHA1"))),
            "configuredOtpCredentials",map("userOtpCredentials",List.of(credential),"selectedCredentialId","demo-otp"),
            "recoveryAuthnCodesConfigBean",map("generatedRecoveryAuthnCodesList",List.of("DEMO0001AAAA","DEMO0002BBBB","DEMO0003CCCC","DEMO0004DDDD"),"generatedRecoveryAuthnCodesAsString","DEMO0001AAAA,DEMO0002BBBB,DEMO0003CCCC,DEMO0004DDDD","generatedAt",1792540800000L),
            "recoveryAuthnCodesInputBean",map("codeNumber",1),"logoutConfirm",map("code","preview","skipLink",false),
            "oauth",map("code","preview","clientScopesRequested",List.of(map("consentScreenText","profileScopeConsentText"),map("consentScreenText","emailScopeConsentText"))),
            "client",map("name","Velcure","clientId","velcure-web","description","Velcure","baseUrl","#app","attributes",map()),
            "identityProviderAlias","Microsoft","idpAlias","Microsoft","brokerContext",map("username","alex@beispiel.invalid","idpConfig",map("alias","microsoft","displayName","Microsoft")),
            "x509",map("formData",map("subjectDN","CN=Alex Beispiel, O=Velcure","username","alex@beispiel.invalid","isUserEnabled",true)),
            "credentialLabel","Authenticator auf dem Smartphone","credentialId","demo-otp","code",map("success",true,"code","DEMO-CODE"),
            "authenticators",map("authenticators",List.of(map("credentialId","demo-passkey","label","Passkey auf diesem Gerät","createdAt","21.10.2026","transports",map("list",List.of("internal"),"internal",true,"iconClass","kcWebAuthnKeyIcon","displayNameProperties",List.of("webauthn-transports-internal"))))),
            "challenge","cHJldmlldw","userid","cHJldmlldw","username","alex@beispiel.invalid","rpId","localhost","rpEntityName","Velcure","signatureAlgorithms",List.of(-7,-257),"attestationConveyancePreference","none","authenticatorAttachment","","requireResidentKey","not specified","residentKey","preferred","userVerificationRequirement","preferred","createTimeout",0,"excludeCredentialIds","","isUserIdentified","true","shouldDisplayAuthenticators",true,"isAppInitiatedAction",false,"isUserEnabled",true,
            "samlPost",map("url","#preview","SAMLRequest","preview","RelayState","preview"),"skipLink",false,
            "frontchannelLogout",map("clients",List.of(map("name","Velcure","frontChannelLogoutUrl","about:blank")),"logoutRedirectUri","#preview"),
            "oid4vci",map(),"credentialOfferUri","openid-credential-offer://preview","sameDeviceWalletUrl","openid4vp://preview","deviceUserCode","DEMO-CODE",
            "realmName","Velcure","link","https://login.example.invalid/action?key=preview-only","linkExpiration",30,"linkExpirationFormatter",constant(language.equals("de")?"30 Minuten":"30 minutes"),"newEmail","alex.neu@beispiel.invalid","firstName","Alex","lastName","Beispiel","code","487193","organization",map("name","Beispielbetrieb"),"identityProviderContext",map("identityProviderAlias","Microsoft","username","alex@beispiel.invalid"),
            "requiredActions",List.of("UPDATE_PASSWORD","VERIFY_EMAIL"),"event",map("date","21.10.2026, 09:41","ipAddress","192.0.2.10","details",map()),
            "subjectKey","accountDisableNotificationSubject","messageKey","accountDisableNotificationBody","daysRemaining",7,"reason","Inaktivität","customMessage","Eine Nachricht deiner Organisation."
        );
        result.put("triggered_from_aia",false);
        result.remove("usernameHidden"); result.remove("isAppInitiatedAction"); result.remove("termsAcceptanceRequired");
        ((Map<String,Object>)result.get("login")).remove("rememberMe");
        result.remove("recaptchaRequired"); result.remove("recaptchaVisible");
        result.put("userVerification","preferred");result.put("credentialOffer",map("qrCode","","uri","openid-credential-offer://preview"));
        result.put("credentialDisplayName","Mitarbeiterausweis");result.put("credentialScopeDisplayName","Mitarbeiterausweis");result.put("execution","preview");
        String qr=Files.readString(ROOT.resolve(".cache/qr.txt")).trim();
        ((Map<String,Object>)result.get("totp")).put("totpSecretQrCode",qr);
        ((Map<String,Object>)result.get("credentialOffer")).put("qrCode",qr);


        result.put("idpDisplayName","Microsoft"); result.put("identityProviderDisplayName","Microsoft");
        result.put("otpLogin",map("userOtpCredentials",List.of(credential),"selectedCredentialId","demo-otp"));
        result.put("logout",map("clients",List.of(map("name","Velcure","frontChannelLogoutUrl","about:blank")),"logoutRedirectUri","#preview"));
        ((Map<String,Object>)result.get("event")).put("getDetail",constant("Authenticator"));
        if(id.equals("login-password") || id.equals("webauthn-authenticate") || id.equals("select-authenticator")) { auth.put("showUsername",yes);auth.put("showTryAnotherWayLink",id.equals("select-authenticator")?no:yes); }
        if(type.equals("login")) result.put("code",map("success",true,"code","DEMO-CODE"));
        if(id.equals("error")) result.put("message",map("type","error","summary",language.equals("de")?"Dieser Link ist nicht mehr gültig. Bitte starte die Anmeldung erneut.":"This link is no longer valid. Please sign in again."));
        if(id.equals("info")) result.put("message",map("type","success","summary",language.equals("de")?"Dein Passwort wurde aktualisiert.":"Your password has been updated."));
        if(state.equals("error")) result.put("message",map("type","error","summary",language.equals("de")?"Bitte prüfe deine Eingaben.":"Please check your entries."));
        return result;
    }
    public static void main(String[] args) throws Exception {
        int passed=0,failed=0; List<String> manifest=new ArrayList<>();
        for(String type:List.of("login","email")) {
            Configuration cfg=new Configuration(Configuration.VERSION_2_3_35);
            List<TemplateLoader> loaders=new ArrayList<>();
            loaders.add(new FileTemplateLoader(ROOT.resolve("themes/velcure/"+type).toFile()));
            if(type.equals("login")) loaders.add(new FileTemplateLoader(ROOT.resolve("vendor/keycloak/keycloak.v2/login").toFile()));
            loaders.add(new FileTemplateLoader(ROOT.resolve(type.equals("email")?"vendor/keycloak/email":"vendor/keycloak/base/login").toFile()));
            cfg.setTemplateLoader(new MultiTemplateLoader(loaders.toArray(new TemplateLoader[0])));
            cfg.setDefaultEncoding("UTF-8");cfg.setOutputFormat(HTMLOutputFormat.INSTANCE);cfg.setLogTemplateExceptions(false);cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
            SortedSet<String> pages=new TreeSet<>();
            if(type.equals("email")) {try(var files=Files.list(ROOT.resolve("vendor/keycloak/email/html"))) {files.filter(p->!p.getFileName().toString().equals("template.ftl")).forEach(p->pages.add(p.getFileName().toString().replace(".ftl","")));}}
            else {for(String dir:List.of("vendor/keycloak/base/login","vendor/keycloak/keycloak.v2/login")) try(var files=Files.list(ROOT.resolve(dir))) {for(Path p:files.filter(p->p.toString().endsWith(".ftl")).toList()) {String s=Files.readString(p);if(s.contains("<@layout.registrationLayout") || (s.contains("<!DOCTYPE html>") && !p.getFileName().toString().equals("template.ftl"))) pages.add(p.getFileName().toString().replace(".ftl",""));}}}
            for(String id:pages) {
                manifest.add("{\"type\":\""+type+"\",\"id\":\""+id+"\"}");
                for(String lang:List.of("de","en")) for(String state:type.equals("login") && List.of("login","register","login-reset-password","login-update-password","login-otp").contains(id)?List.of("default","error"):List.of("default")) {
                    for(String format:type.equals("email")?List.of("html","text"):List.of("html")) {
                        try {
                            String template=type.equals("email")?format+"/"+id+".ftl":id+".ftl";
                            StringWriter out=new StringWriter();cfg.setOutputFormat(format.equals("text") ? freemarker.core.PlainTextOutputFormat.INSTANCE : HTMLOutputFormat.INSTANCE);cfg.getTemplate(template).process(fixture(type,id,lang,state),out);
                            Path dest=ROOT.resolve(".cache/previews/"+type+"/"+id+"/"+lang+"-"+state+"."+(format.equals("text")?"txt":"html"));
                            Files.createDirectories(dest.getParent()); Files.writeString(dest,out.toString());passed++;
                        } catch(Exception ex) {failed++;System.err.println(type+"/"+id+" ["+lang+"/"+state+"/"+format+"]: "+ex.getMessage().split("\n")[0]+" "+Arrays.stream(ex.getMessage().split("\n")).filter(s->s.contains("==>")||s.contains("line ")).findFirst().orElse(""));}
                    }
                }
            }
        }
        Files.createDirectories(ROOT.resolve(".cache"));Files.writeString(ROOT.resolve(".cache/manifest.json"),"["+String.join(",",manifest)+"]");
        System.out.println("Rendered "+passed+" previews; "+failed+" failures.");if(failed>0)System.exit(1);
    }
}
