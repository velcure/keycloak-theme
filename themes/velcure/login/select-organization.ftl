<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
  <#if section = "header">
    ${msg("organization.select")}
  <#elseif section = "form">
    <form action="${url.loginAction}" method="post">
      <ul class="vc-methods" role="list">
        <#list user.organizations as organization>
          <li>
            <button type="submit" class="vc-method" name="kc.org" value="${organization.alias!}" id="organization-${organization.alias}">
              <span class="vc-method-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 21V5l8-3 8 3v16M8 8h2m4 0h2M8 12h2m4 0h2M10 21v-5h4v5M2 21h20"/></svg></span>
              <span class="vc-method-copy"><span class="vc-method-title">${organization.name!}</span></span>
              <svg class="vc-method-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
            </button>
          </li>
        </#list>
      </ul>
    </form>
  </#if>
</@layout.registrationLayout>
