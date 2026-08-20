import { Component } from '@angular/core';
import { PaymentApiService } from '@app/billing/data-payment-api';

@Component({
  selector: 'app-profile',
  template: '<p>Profile</p>',
})
export class ProfileComponent {
  constructor(private paymentApi: PaymentApiService) {}
}
