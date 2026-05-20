import type { getTranslations } from 'next-intl/server';
import { ORDER_SCHEDULE_TYPES, ORDER_STATUSES, type OrderScheduleType, type OrderStatus } from '../../types';
import { getOrderActivity } from '../actions/get-order-activity';
import { getOrderBilling } from '../actions/get-order-billing';
import { getOrderDetail } from '../actions/get-order-detail';
import { getOrderDocuments } from '../actions/get-order-documents';
import { getOrderHours } from '../actions/get-order-hours';
import { getOrderServiceData } from '../actions/get-order-service-data';
import { getOrderTagOptions } from '../actions/get-order-tag-options';
import { getOrderTalents } from '../actions/get-order-talents';
import { getTalentSearchContext } from '../actions/get-talent-search-context';
import type { TalentSearchContext } from '../actions/get-talent-search-context';
import type {
  ActivityTabHints,
  AssignedTalent,
  BillingTabData,
  BillingTabHints,
  DetailTabsHints,
  DocumentsTabHints,
  HeaderHints,
  HoursTabData,
  HoursTabHints,
  OrderActivityNote,
  OrderDetail,
  OrderDocumentEntry,
  OrderTagOption,
  ServiceTabContext,
  ServiceTabData,
  ServiceTabHints,
  SpecialistsTabHints,
} from '../types';

type T = Awaited<ReturnType<typeof getTranslations>>;

const PAYMENT_STATUSES = [
  'sin_pago',
  'pending',
  'pendiente_de_pago',
  'paid',
  'cancelled',
  'overdue',
] as const;

export type OrderDetailPageHints = {
  header: HeaderHints;
  tabs: DetailTabsHints;
  service: ServiceTabHints;
  specialists: SpecialistsTabHints;
  hours: HoursTabHints;
  billing: BillingTabHints;
  documents: DocumentsTabHints;
  activity: ActivityTabHints;
};

export type OrderDetailPageData = {
  order: OrderDetail;
  availableTags: OrderTagOption[];
  initialServiceData: ServiceTabData;
  initialServiceContext: ServiceTabContext;
  initialAssigned: AssignedTalent[];
  initialTalentSearchContext: TalentSearchContext;
  initialHours: HoursTabData;
  initialBilling: BillingTabData;
  initialDocuments: OrderDocumentEntry[];
  initialActivity: OrderActivityNote[];
  hints: OrderDetailPageHints;
};

/**
 * Loads everything an order detail page (regular or archive) needs in
 * parallel and resolves all i18n hints. Returns null when the order does
 * not exist OR when the service data fails to load (so the caller can
 * `notFound()`).
 *
 * Both `/admin/orders/[id]` and `/admin/archive/[id]` consume this helper.
 * The caller controls the back-link and the readOnly mode based on its
 * route context.
 */
export async function loadOrderDetailPageData(
  id: string,
  locale: string,
  t: T,
): Promise<OrderDetailPageData | null> {
  const order = await getOrderDetail(id, locale);
  if (!order) return null;

  const [
    serviceRes,
    initialAssigned,
    initialTalentSearchContext,
    initialHours,
    initialBilling,
    initialDocuments,
    initialActivity,
    availableTags,
  ] = await Promise.all([
    getOrderServiceData(id, locale),
    getOrderTalents(id),
    getTalentSearchContext(id, locale),
    getOrderHours(id),
    getOrderBilling(id),
    getOrderDocuments(id, locale),
    getOrderActivity(id),
    getOrderTagOptions(locale),
  ]);
  if (!serviceRes) return null;

  return {
    order,
    availableTags,
    initialServiceData: serviceRes.data,
    initialServiceContext: serviceRes.context,
    initialAssigned,
    initialTalentSearchContext,
    initialHours,
    initialBilling,
    initialDocuments,
    initialActivity,
    hints: {
      header: readHeader(t),
      tabs: readTabsHints(t),
      service: readService(t),
      specialists: readSpecialists(t),
      hours: readHours(t),
      billing: readBilling(t),
      documents: readDocuments(t),
      activity: readActivity(t),
    },
  };
}

// ── i18n hint readers ───────────────────────────────────────────────────

function readHeader(t: T): HeaderHints {
  const statusLabels: Record<OrderStatus, string> = {} as Record<OrderStatus, string>;
  for (const s of ORDER_STATUSES) statusLabels[s] = t(`header.statusLabels.${s}`);
  const paymentStatusLabels: Record<string, string> = {};
  for (const s of PAYMENT_STATUSES) paymentStatusLabels[s] = t(`header.paymentStatusLabels.${s}`);
  return {
    statusLabels,
    paymentStatusLabels,
    fieldStatus: t('header.fieldStatus'),
    fieldPaymentStatus: t('header.fieldPaymentStatus'),
    fieldStaff: t('header.fieldStaff'),
    fieldDuration: t('header.fieldDuration'),
    fieldAppointmentDate: t('header.fieldAppointmentDate'),
    fieldSchedule: t('header.fieldSchedule'),
    fieldTotal: t('header.fieldTotal'),
    fieldTotalSuffix: t('header.fieldTotalSuffix'),
    fieldCreatedAt: t('header.fieldCreatedAt'),
    fieldTags: t('header.fieldTags'),
    fieldClient: t('header.fieldClient'),
    noStaff: t('header.noStaff'),
    noPhone: t('header.noPhone'),
    noEmail: t('header.noEmail'),
    manageTags: t('header.manageTags'),
    noTags: t('header.noTags'),
    cancelOrderButton: t('header.cancelOrderButton'),
    cancelOrderTitle: t('header.cancelOrderTitle'),
    cancelOrderWarning: t('header.cancelOrderWarning'),
    cancelOrderConfirm: t('header.cancelOrderConfirm'),
    cancelOrderCancel: t('header.cancelOrderCancel'),
    cancelOrderSuccess: t('header.cancelOrderSuccess'),
    cancelOrderError: t('header.cancelOrderError'),
    statusUpdateSuccess: t('header.statusUpdateSuccess'),
    statusUpdateError: t('header.statusUpdateError'),
    tagsUpdateSuccess: t('header.tagsUpdateSuccess'),
    tagsUpdateError: t('header.tagsUpdateError'),
    seriesBadgeTemplate: (current, total) =>
      t('header.seriesBadge', { current, total }),
    seriesStatusLabels: {
      active: t('header.seriesStatusActive'),
      completed: t('header.seriesStatusCompleted'),
      cancelled: t('header.seriesStatusCancelled'),
    },
    completeOccurrenceButton: t('header.completeOccurrenceButton'),
    completeOccurrenceConfirmTitle: t('header.completeOccurrenceConfirmTitle'),
    completeOccurrenceConfirmBody: t('header.completeOccurrenceConfirmBody'),
    completeOccurrenceConfirmSeriesBody: t('header.completeOccurrenceConfirmSeriesBody'),
    completeOccurrenceConfirmYes: t('header.completeOccurrenceConfirmYes'),
    completeOccurrenceConfirmCancel: t('header.completeOccurrenceConfirmCancel'),
    completeOccurrenceSuccess: t('header.completeOccurrenceSuccess'),
    completeOccurrenceAdvancedToast: (orderNumber) =>
      t('header.completeOccurrenceAdvanced', { orderNumber }),
    completeOccurrenceSeriesClosedToast: (completed, total) =>
      t('header.completeOccurrenceSeriesClosed', { completed, total }),
    completeOccurrenceError: t('header.completeOccurrenceError'),
  };
}

function readTabsHints(t: T): DetailTabsHints {
  return {
    service: t('tabs.service'),
    specialists: t('tabs.specialists'),
    hours: t('tabs.hours'),
    billing: t('tabs.billing'),
    documents: t('tabs.documents'),
    activity: t('tabs.activity'),
  };
}

function readService(t: T): ServiceTabHints {
  const scheduleTypeLabels: Record<OrderScheduleType, string> = {} as Record<OrderScheduleType, string>;
  for (const s of ORDER_SCHEDULE_TYPES) scheduleTypeLabels[s] = t(`service.scheduleTypeLabels.${s}`);
  const weekdayShort: string[] = [];
  for (let i = 0; i < 7; i++) weekdayShort.push(t(`service.weekdayShort.${i}`));
  return {
    section: {
      expandLabel: t('service.section.expandLabel'),
      collapseLabel: t('service.section.collapseLabel'),
      editLabel: t('service.section.editLabel'),
      saveLabel: t('service.section.saveLabel'),
      cancelLabel: t('service.section.cancelLabel'),
      saveSuccess: t('service.section.saveSuccess'),
      saveError: t('service.section.saveError'),
      unsavedPrompt: t('service.section.unsavedPrompt'),
    },
    languageTitle: t('service.languageTitle'),
    addressTitle: t('service.addressTitle'),
    serviceAnswersTitle: t('service.serviceAnswersTitle'),
    recurrenceTitle: t('service.recurrenceTitle'),
    notesTitle: t('service.notesTitle'),
    preferredLanguageLabel: t('service.preferredLanguageLabel'),
    addressLabel: t('service.addressLabel'),
    countryLabel: t('service.countryLabel'),
    cityLabel: t('service.cityLabel'),
    postalCodeLabel: t('service.postalCodeLabel'),
    serviceNameLabel: t('service.serviceNameLabel'),
    scheduleTypeLabel: t('service.scheduleTypeLabel'),
    repeatEveryLabel: t('service.repeatEveryLabel'),
    weekdaysLabel: t('service.weekdaysLabel'),
    startDateLabel: t('service.startDateLabel'),
    endDateLabel: t('service.endDateLabel'),
    timeWindowStartLabel: t('service.timeWindowStartLabel'),
    timeWindowEndLabel: t('service.timeWindowEndLabel'),
    hoursPerSessionLabel: t('service.hoursPerSessionLabel'),
    recurrenceSummaryLabel: t('service.recurrenceSummaryLabel'),
    notesLabel: t('service.notesLabel'),
    talentsNeededLabel: t('service.talentsNeededLabel'),
    scheduleTypeLabels,
    weekdayShort,
    empty: t('service.empty'),
    notProvided: t('service.notProvided'),
    seriesFrequencyLabel: t('service.seriesFrequencyLabel'),
    seriesFrequencyWeekly: t('service.seriesFrequencyWeekly'),
    seriesFrequencyMonthly: t('service.seriesFrequencyMonthly'),
    seriesDayOfMonthLabel: t('service.seriesDayOfMonthLabel'),
    seriesTimeStartLabel: t('service.seriesTimeStartLabel'),
    seriesTimeEndLabel: t('service.seriesTimeEndLabel'),
    seriesTotalOccurrencesLabel: t('service.seriesTotalOccurrencesLabel'),
    seriesOccurrencesCompletedLabel: t('service.seriesOccurrencesCompletedLabel'),
    seriesOccurrencesCancelledLabel: t('service.seriesOccurrencesCancelledLabel'),
    seriesStatusLabel: t('service.seriesStatusLabel'),
    seriesStatusActive: t('service.seriesStatusActive'),
    seriesStatusCompleted: t('service.seriesStatusCompleted'),
    seriesStatusCancelled: t('service.seriesStatusCancelled'),
    seriesSequenceTemplate: (current, total) =>
      t('service.seriesSequence', { current, total }),
    appointmentDateLabel: t('service.appointmentDateLabel'),
  };
}

function readSpecialists(t: T): SpecialistsTabHints {
  return {
    columnName: t('specialists.columnName'),
    columnEmail: t('specialists.columnEmail'),
    columnPhone: t('specialists.columnPhone'),
    columnRating: t('specialists.columnRating'),
    columnCompleted: t('specialists.columnCompleted'),
    columnAction: t('specialists.columnAction'),
    selectButton: t('specialists.selectButton'),
    unselectButton: t('specialists.unselectButton'),
    empty: t('specialists.empty'),
    noStaffAssigned: t('specialists.noStaffAssigned'),
    addTalentButton: t('specialists.addTalentButton'),
    modalTitle: t('specialists.modalTitle'),
    modalSearchPlaceholder: t('specialists.modalSearchPlaceholder'),
    modalEmpty: t('specialists.modalEmpty'),
    modalCancel: t('specialists.modalCancel'),
    maxReachedToast: t('specialists.maxReachedToast'),
    selectSuccess: t('specialists.selectSuccess'),
    selectError: t('specialists.selectError'),
    removeSuccess: t('specialists.removeSuccess'),
    removeError: t('specialists.removeError'),
    reviewsCount: t('specialists.reviewsCount'),
    qualifiedBadge: t('specialists.qualifiedBadge'),
    loading: t('specialists.loading'),
    filters: {
      searchPlaceholder: t('specialists.filters.searchPlaceholder'),
      filtersLabel: t('specialists.filters.filtersLabel'),
      filterCountry: t('specialists.filters.filterCountry'),
      filterCity: t('specialists.filters.filterCity'),
      filterPostalCode: t('specialists.filters.filterPostalCode'),
      filterService: t('specialists.filters.filterService'),
      postalCodePlaceholder: t('specialists.filters.postalCodePlaceholder'),
      clearFilters: t('specialists.filters.clearFilters'),
      notProvided: t('specialists.filters.notProvided'),
    },
    row: {
      selectButton: t('specialists.row.selectButton'),
      qualifiedBadge: t('specialists.row.qualifiedBadge'),
      reviewsCount: t('specialists.row.reviewsCount'),
      servicesCount: t('specialists.row.servicesCount'),
      expandLabel: t('specialists.row.expandLabel'),
      collapseLabel: t('specialists.row.collapseLabel'),
      detailCountryLabel: t('specialists.row.detailCountryLabel'),
      detailCityLabel: t('specialists.row.detailCityLabel'),
      detailPostalCodeLabel: t('specialists.row.detailPostalCodeLabel'),
      detailRegisteredServicesLabel: t('specialists.row.detailRegisteredServicesLabel'),
      notProvided: t('specialists.row.notProvided'),
    },
    pagination: {
      pageInfo: t('specialists.pagination.pageInfo'),
      prev: t('specialists.pagination.prev'),
      next: t('specialists.pagination.next'),
    },
  };
}

function readHours(t: T): HoursTabHints {
  return {
    totalHoursLabel: t('hours.totalHoursLabel'),
    totalHoursClientLabel: t('hours.totalHoursClientLabel'),
    totalKilometersLabel: t('hours.totalKilometersLabel'),
    otherLabel: t('hours.otherLabel'),
    unitPriceLabel: t('hours.unitPriceLabel'),
    reportedByLabel: t('hours.reportedByLabel'),
    reportedQtyLabel: t('hours.reportedQtyLabel'),
    confirmedQtyLabel: t('hours.confirmedQtyLabel'),
    confirmedKmLabel: t('hours.confirmedKmLabel'),
    confirmedOtherLabel: t('hours.confirmedOtherLabel'),
    pricePerKmLabel: t('hours.pricePerKmLabel'),
    pricePerOtherLabel: t('hours.pricePerOtherLabel'),
    addOtherButton: t('hours.addOtherButton'),
    removeOtherButton: t('hours.removeOtherButton'),
    saveLabel: t('hours.saveLabel'),
    saveSuccess: t('hours.saveSuccess'),
    saveError: t('hours.saveError'),
  };
}

function readBilling(t: T): BillingTabHints {
  return {
    clientSectionTitle: t('billing.clientSectionTitle'),
    talentSectionTitlePrefix: t('billing.talentSectionTitlePrefix'),
    totalPaidLabel: t('billing.totalPaidLabel'),
    totalOwedLabel: t('billing.totalOwedLabel'),
    columnService: t('billing.columnService'),
    columnUnitPrice: t('billing.columnUnitPrice'),
    columnQty: t('billing.columnQty'),
    columnDiscount: t('billing.columnDiscount'),
    columnPrice: t('billing.columnPrice'),
    subtotalLabel: t('billing.subtotalLabel'),
    vatLabel: t('billing.vatLabel'),
    totalLabel: t('billing.totalLabel'),
    invoiceButton: t('billing.invoiceButton'),
    invoiceSuccess: t('billing.invoiceSuccess'),
    invoiceError: t('billing.invoiceError'),
    invoicedBadge: t('billing.invoicedBadge'),
    addLineButton: t('billing.addLineButton'),
    modalTitle: t('billing.modalTitle'),
    modalDescriptionLabel: t('billing.modalDescriptionLabel'),
    modalDescriptionPlaceholder: t('billing.modalDescriptionPlaceholder'),
    modalUnitPriceLabel: t('billing.modalUnitPriceLabel'),
    modalQtyLabel: t('billing.modalQtyLabel'),
    modalDiscountLabel: t('billing.modalDiscountLabel'),
    modalCancel: t('billing.modalCancel'),
    modalCreate: t('billing.modalCreate'),
    modalCreateError: t('billing.modalCreateError'),
    empty: t('billing.empty'),
    noTalentsAssigned: t('billing.noTalentsAssigned'),
    noTalentsAssignedHelp: t('billing.noTalentsAssignedHelp'),
  };
}

function readDocuments(t: T): DocumentsTabHints {
  return {
    columnDocument: t('documents.columnDocument'),
    columnUploadedAt: t('documents.columnUploadedAt'),
    columnAction: t('documents.columnAction'),
    download: t('documents.download'),
    empty: t('documents.empty'),
    emptyHelp: t('documents.emptyHelp'),
  };
}

function readActivity(t: T): ActivityTabHints {
  return {
    composerPlaceholder: t('activity.composerPlaceholder'),
    addButton: t('activity.addButton'),
    systemAuthor: t('activity.systemAuthor'),
    empty: t('activity.empty'),
    errorSaving: t('activity.errorSaving'),
    relativeJustNow: t('activity.relativeJustNow'),
    relativeMinutes: t('activity.relativeMinutes'),
    relativeHours: t('activity.relativeHours'),
    relativeDays: t('activity.relativeDays'),
  };
}
