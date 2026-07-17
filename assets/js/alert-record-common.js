/** 预警记录通知推送：与预警规则关联的公共逻辑 */
(function () {
  function channelsFromRule(rule) {
    if (!rule) return [];
    const channels = [];
    if (rule.notifySms) channels.push('短信');
    if (rule.notifyEmail) channels.push('邮件');
    if (rule.notifySiteMsg) channels.push('站内消息');
    return channels;
  }

  function recipientsFromRule(rule) {
    if (!rule) return [];
    if (rule.recipientDetails?.length) {
      return rule.recipientDetails.map(p => ({ ...p }));
    }
    const names = rule.recipientNames || [];
    const ids = rule.recipients || [];
    return names.map((name, i) => ({ id: ids[i] || `r-${i}`, name, meta: '' }));
  }

  function buildPushLogs(record, rule) {
    const channels = record.notifyChannels?.length
      ? record.notifyChannels
      : channelsFromRule(rule);
    const recipients = record.notifyRecipients?.length
      ? record.notifyRecipients
      : recipientsFromRule(rule);

    if (!record.abnormalMetrics || !channels.length || !recipients.length) {
      return [];
    }

    if (record.notifyLogs?.length) return record.notifyLogs;

    const baseTime = record.notifyPushedAt || record.triggerTime || '';
    return recipients.flatMap(person => channels.map(channel => ({
      recipientId: person.id,
      recipientName: person.name,
      recipientMeta: person.meta || '',
      channel,
      status: 'success',
      pushedAt: baseTime
    })));
  }

  function enrichRecord(record) {
    if (!record) return null;
    const rule = window.AlertRulesStore?.getById?.(record.ruleId);
    const notifyChannels = record.notifyChannels?.length
      ? record.notifyChannels
      : channelsFromRule(rule);
    const notifyRecipients = record.notifyRecipients?.length
      ? record.notifyRecipients
      : recipientsFromRule(rule);
    const notifyPushed = record.notifyPushed != null
      ? record.notifyPushed
      : !!(record.abnormalMetrics && notifyChannels.length && notifyRecipients.length);
    const notifyLogs = buildPushLogs(
      { ...record, notifyChannels, notifyRecipients, notifyPushed },
      rule
    );

    return {
      ...record,
      notifyChannels,
      notifyRecipients,
      notifyPushed,
      notifyPushedAt: notifyPushed
        ? (record.notifyPushedAt || record.triggerTime || '')
        : '',
      notifyLogs
    };
  }

  function formatChannels(record) {
    const enriched = enrichRecord(record);
    if (!enriched.notifyPushed) return '';
    return enriched.notifyChannels.join('、') || '';
  }

  function formatRecipientNames(record) {
    const enriched = enrichRecord(record);
    if (!enriched.notifyPushed) return '';
    return enriched.notifyRecipients.map(p => p.name).filter(Boolean).join('、') || '';
  }

  window.AlertRecordCommon = {
    enrichRecord,
    formatChannels,
    formatRecipientNames,
    channelsFromRule,
    recipientsFromRule
  };
})();
