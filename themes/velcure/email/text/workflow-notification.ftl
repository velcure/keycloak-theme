<#ftl output_format="plainText">
${(msg(subjectKey, daysRemaining, reason))}

<#if messageKey == "customMessage">
${(customMessage)}
<#else>
${(msg("accountNotificationGreeting", user.firstName!user.username))}

${(msg(messageKey, daysRemaining, reason))}

<#if daysRemaining gt 0>
    ${(msg("accountNotificationTimeRemaining", daysRemaining))}
</#if>

${(msg("accountNotificationQuestions", realmName))}

${(msg("accountNotificationSignature"))}
${(msg("accountNotificationSignatureFrom", realmName))}
</#if>