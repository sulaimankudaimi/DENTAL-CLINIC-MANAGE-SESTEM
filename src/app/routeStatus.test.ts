import test from 'node:test';
import assert from 'node:assert/strict';
import { isRouteImplemented, NOT_IMPLEMENTED_ROUTES, shouldRenderDevRoute } from './routeStatus';
import { TCodeService } from '../lib/tcodeService';
import { filterVisibleNavItems, isNavItemLocked } from '../components/layout/Sidebar';
import { DEV_CREDENTIALS } from '../../shared/devCredentials';

test('isRouteImplemented: correctly distinguishes implemented vs placeholder routes', () => {
  // Unimplemented exact routes
  for (const route of NOT_IMPLEMENTED_ROUTES) {
    assert.equal(isRouteImplemented(route), false, `${route} should not be implemented`);
  }

  // Prefix matching (child paths of unimplemented routes)
  assert.equal(isRouteImplemented('/admin/users/123'), false);
  assert.equal(isRouteImplemented('/procurement/po/create'), false);
  assert.equal(isRouteImplemented('/procurement/rfq/detail/1'), false);

  // Implemented existing routes
  assert.equal(isRouteImplemented('/dashboard'), true);
  assert.equal(isRouteImplemented('/patients'), true);
  assert.equal(isRouteImplemented('/patients/pat-001'), true);
  assert.equal(isRouteImplemented('/appointments'), true);
  assert.equal(isRouteImplemented('/inventory'), true);
  assert.equal(isRouteImplemented('/billing'), true);
  assert.equal(isRouteImplemented('/reports'), true);
  assert.equal(isRouteImplemented('/settings'), true);
});

test('TCodeService: returns unavailable message for ME21N and ME51N while MM03 navigates', () => {
  const me21n = TCodeService.resolve('ME21N');
  assert.equal(me21n.success, false);
  assert.equal(me21n.message, 'هذه الشاشة غير متاحة بعد في هذا الإصدار');

  const me51n = TCodeService.resolve('ME51N');
  assert.equal(me51n.success, false);
  assert.equal(me51n.message, 'هذه الشاشة غير متاحة بعد في هذا الإصدار');

  const mm03 = TCodeService.resolve('MM03');
  assert.equal(mm03.success, true);
  assert.equal(mm03.path, '/inventory');

  const bp = TCodeService.resolve('BP');
  assert.equal(bp.success, true);
  assert.equal(bp.path, '/patients');

  // Autocomplete omits unimplemented routes
  const ac = TCodeService.getAutocomplete('ME');
  assert.equal(ac.length, 0);

  const acMm = TCodeService.getAutocomplete('MM');
  assert.equal(acMm.length, 1);
  assert.equal(acMm[0].code, 'MM03');
});

test('Sidebar filterVisibleNavItems: omits unimplemented routes', () => {
  const sampleItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/procurement/po', label: 'Purchase Orders' },
    { path: '/admin/users', label: 'Users' },
    { path: '/patients', label: 'Patients' },
  ];

  const visible = filterVisibleNavItems(sampleItems as any, () => true);
  assert.deepEqual(
    visible.map((i) => i.path),
    ['/dashboard', '/patients']
  );
});

test('Dev route decision function: requires demo mode flag AND admin permission', () => {
  assert.equal(shouldRenderDevRoute('false', true), false);
  assert.equal(shouldRenderDevRoute(undefined, true), false);
  assert.equal(shouldRenderDevRoute('true', false), false);
  assert.equal(shouldRenderDevRoute('true', true), true);
});

test('DEV_CREDENTIALS: does not contain mona.ast and contains dr.ahmed', () => {
  assert.equal('mona.ast' in DEV_CREDENTIALS, false);
  assert.equal(DEV_CREDENTIALS['dr.ahmed'].password, 'Ahmad@Dental2026');
});

test('Sidebar isNavItemLocked: shows lock on insurance and inventory in basic plan', () => {
  // في باقة basic يظهر قفل على «التأمين» و«المخزون»
  assert.equal(isNavItemLocked({ id: 'insurance' }, 'basic'), true);
  assert.equal(isNavItemLocked({ id: 'inventory' }, 'basic'), true);

  // باقي العناصر لا تظهر عليها أقفال في باقة basic
  assert.equal(isNavItemLocked({ id: 'patients' }, 'basic'), false);
  assert.equal(isNavItemLocked({ id: 'appointments' }, 'basic'), false);
  assert.equal(isNavItemLocked({ id: 'treatments' }, 'basic'), false);
  assert.equal(isNavItemLocked({ id: 'billing' }, 'basic'), false);

  // في باقة pro وباقة enterprise لا يظهر قفل على التأمين والمخزون
  assert.equal(isNavItemLocked({ id: 'insurance' }, 'pro'), false);
  assert.equal(isNavItemLocked({ id: 'inventory' }, 'pro'), false);
  assert.equal(isNavItemLocked({ id: 'insurance' }, 'enterprise'), false);
  assert.equal(isNavItemLocked({ id: 'inventory' }, 'enterprise'), false);
});

