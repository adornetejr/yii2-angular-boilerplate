import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import swal from 'sweetalert2';

import { UserDataService } from '../model/user-data.service';
import { User } from '../model/user';
import { StaffService } from '../model/staff.service';
import { UserList } from '../model/user-list';

@Component({
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  userList: UserList;
  errorMessage: string;

  loading: boolean;

  totalCount: number;
  currentPage: number;
  pageSize: number;

  searchParams: any;

  constructor(private userDataService: UserDataService,
      private staffService: StaffService,
      private router: Router,
      private activatedRoute: ActivatedRoute) {

    const queryParams = this.activatedRoute.snapshot.queryParams;
    this.currentPage = typeof queryParams['page'] !== 'undefined' ? +queryParams['page'] : 1;

    this.searchParams = {
      page: this.currentPage,
    };

    if (typeof queryParams['q'] !== 'undefined') {
      this.searchParams.q = queryParams['q'] + '';
    }
  }

  ngOnInit() {
    this.getUsers();
  }

  onSearchFormSubmit() {
    this.searchParams.page = 1;
    this.currentPage = 1;
    this.getUsers();
  }

  /**
   * Handle page changed from pagination
   *
   * @param event
   */
  pageChanged(event: any): void {
    if (event.page !== this.currentPage) {
      this.currentPage = event.page;
      this.searchParams.page = this.currentPage;

      this.getUsers();
    }
  }


  public getUsers() {
    this.userList = null;
    this.loading = true;
    this.router.navigate([], { queryParams: this.searchParams });

    this.userDataService.getAllUsers(this.searchParams)
        .subscribe(
            userList => {
              this.userList = userList;
              this.totalCount = this.userList.pagination.totalCount;
              this.pageSize = this.userList.pagination.defaultPageSize;
            },
            error => {
              // unauthorized access
              if (error.status == 401 || error.status == 403) {
                this.staffService.unauthorizedAccess(error);
              } else {
                this.errorMessage = error.data.message;
              }
            },
            () => {
              this.loading = false;
            }
        );
  }

  public viewUser(user: User): void {
    this.router.navigate(['/user', user.id]);
  }

  public confirmDeleteUser(user: User): void {
    // Due to sweet alert scope issue, define as function variable and pass to swal

    let parent = this;
    // let getUsers = this.getUsers;
    this.errorMessage = '';

    swal({
      title: 'Are you sure?',
      text: 'Once delete, you won\'t be able to revert this!',
      type: 'question',
      showLoaderOnConfirm: true,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      preConfirm: function () {
        parent.loading = true;
        return new Promise(function (resolve, reject) {
          parent.userDataService.deleteUserById(user.id)
                .subscribe(
                    result => {
                      parent.getUsers();
                      resolve();
                    },
                    error => {
                      // unauthorized access
                      if (error.status == 401 || error.status == 403) {
                        parent.staffService.unauthorizedAccess(error);
                      } else {
                        parent.errorMessage = error.data.message;
                      }
                      resolve();

                    },
                    () => {
                      parent.loading = false;
                    }
                );
        })
      }
    }).then(function (result) {
      // handle confirm, result is needed for modals with input

    }, function (dismiss) {
      // dismiss can be "cancel" | "close" | "outside"
    });
  }
}
