import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SearchBoxComponent } from './search-box.component';
import { SearchService } from './search.service';

describe('SearchBoxComponent', () => {
  let component: SearchBoxComponent;
  let fixture: ComponentFixture<SearchBoxComponent>;
  let searchService: jasmine.SpyObj<SearchService>;

  beforeEach(waitForAsync(() => {
    const spy = jasmine.createSpyObj('SearchService', ['search']);

    TestBed.configureTestingModule({
      declarations: [SearchBoxComponent],
      providers: [{ provide: SearchService, useValue: spy }],
    }).compileComponents();

    searchService = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should debounce search input', (done) => {
    spyOn(component, 'onSearch').and.callThrough();
    component.query.set('test');

    setTimeout(() => {
      expect(searchService.search).toHaveBeenCalledWith('test');
      done();
    }, 400);
  });
});
