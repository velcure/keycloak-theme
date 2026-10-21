<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false; section>
  <#if section = "header">
    ${msg("loginChooseAuthenticator")}
  <#elseif section = "form">
    <ul class="vc-methods" role="list">
      <#list auth.authenticationSelections as selection>
        <li>
          <form action="${url.loginAction}" method="post">
            <input type="hidden" name="authenticationExecution" value="${selection.authExecId}">
            <button type="submit" class="vc-method">
              <span class="vc-method-icon" aria-hidden="true"><i class="${properties[selection.iconCssClass]!selection.iconCssClass}"></i></span>
              <span class="vc-method-copy"><span class="vc-method-title">${msg(selection.displayName)}</span><span class="vc-method-description">${msg(selection.helpText)}</span></span>
              <svg class="vc-method-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
            </button>
          </form>
        </li>
      </#list>
    </ul>
  </#if>
</@layout.registrationLayout>
