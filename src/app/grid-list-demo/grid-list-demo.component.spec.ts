import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridListDemoComponent } from './grid-list-demo.component';

describe('GridListDemoComponent', () => {
  let component: GridListDemoComponent;
  let fixture: ComponentFixture<GridListDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GridListDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GridListDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
