import { TestBed } from '@angular/core/testing';

import { SessionNoticeService } from './auth-notice.service';

describe('SessionNoticeService', () => {
  let service: SessionNoticeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionNoticeService);
  });

  it('empieza sin mensaje', () => {
    expect(service.message()).toBeNull();
  });

  it('muestra y limpia el aviso', () => {
    service.show('Tu sesión expiró');
    expect(service.message()).toBe('Tu sesión expiró');

    service.clear();
    expect(service.message()).toBeNull();
  });
});
