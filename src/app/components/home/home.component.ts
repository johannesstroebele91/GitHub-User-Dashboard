import {Component, OnDestroy, OnInit} from '@angular/core';
import {UsersService} from '../../../services/users.service';
import {ArcElement, Chart, ChartData, ChartOptions, ChartType, DoughnutController, Legend, Tooltip} from 'chart.js';
import {User} from '../../../models/user';
import {Repo} from '../../../models/repo';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../services/auth.service';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

/* STRUCTURE
  1. Variables
  2. Constructor
  3. API request methods
  4. Links methods
  5. General Methods
 */

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  // AUTHENTICATION
  isAuthenticated = false;
  // CHART
  username = '';
  user: User | undefined;
  repos: Repo[] = [];
  reposAmount = 0;
  pieChartLegend = true;
  pieChartType: ChartType = 'doughnut';
  pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: this.pieChartLegend,
        position: 'top',
      }
    }
  };
  pieChartColors = [{
    backgroundColor: ['#1abc9c', '#9b59b6', '#3498db', '#C4E538', '#eb4d4b',
      '#686de0', '#7ed6df', '#f9ca24', '#a29bfe', '#00b894',
      '#1abc9c', '#9b59b6', '#3498db', '#C4E538', '#eb4d4b',
      '#686de0', '#7ed6df', '#f9ca24', '#a29bfe', '#00b894',
      '#1abc9c', '#9b59b6', '#3498db', '#C4E538', '#eb4d4b',
      '#686de0', '#7ed6df', '#f9ca24', '#a29bfe', '#00b894']
  },
  ];

  // Most used languages
  languageInRepos: string[] = [];
  languageInReposWithoutDuplicates: string[] = [];
  numberOfLanguageInReposWithoutDuplicates: number[] = [];
  pieChartDataNumberOfLanguages: ChartData<'doughnut'> = {
    labels: this.languageInReposWithoutDuplicates,
    datasets: [
      {
        data: this.numberOfLanguageInReposWithoutDuplicates,
        backgroundColor: this.pieChartColors[0].backgroundColor,
      }
    ]
  };

  // Most stared repositories
  starsNameOfRepos: string[] = [];
  starsOfRepos: number[] = [];
  pieChartDataStarsOfRepos: ChartData<'doughnut'> = {
    labels: this.starsNameOfRepos,
    datasets: [
      {
        data: this.starsOfRepos,
        backgroundColor: this.pieChartColors[0].backgroundColor,
      }
    ]
  };

  // Largest repositories
  sizeNameOfRepos: string[] = [];
  sizeOfRepos: number[] = [];
  pieChartDataSizeOfRepos: ChartData<'doughnut'> = {
    labels: this.sizeNameOfRepos,
    datasets: [
      {
        data: this.sizeOfRepos,
        backgroundColor: this.pieChartColors[0].backgroundColor,
      }
    ]
  };

  // Most forked repositories
  forkNameOfRepos: string[] = [];
  forkOfRepos: number[] = [];
  pieChartDataForksOfRepos: ChartData<'doughnut'> = {
    labels: this.forkNameOfRepos,
    datasets: [
      {
        data: this.forkOfRepos,
        backgroundColor: this.pieChartColors[0].backgroundColor,
      }
    ]
  };

  // User Subscription for Authentication
  private userSub: Subscription | undefined;

  // CONSTRUCTOR
  constructor(private usersService: UsersService, private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.autoLoginAfterReload();

    this.userSub = this.authService.user.subscribe((user) => {
      this.isAuthenticated = !user ? false : true;
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // API REQUEST METHODS
  searchUsername(username?: string) {

    // Search for string from last searched usernames
    if (username) {
      this.username = username;
    }

    // Update GitHub username with input from user
    this.usersService.updateUsername(this.username);

    // Gets respective searched user data from service
    // Subscription to function necessary, because it returns an observable
    this.usersService.getUserData().subscribe({
      next: data => this.user = data,
      error: data => console.log('Error occurred during getting user', data)
    });

    // Gets respective searched data about user's repos from service
    this.usersService.getUserReposData().subscribe({
      next: data => {
        this.repos = data;

        // For displaying number of repos
        this.reposAmount = Object.keys(this.repos).length;

        for (let i = 0; i < this.reposAmount; i++) {

          // Most stared repository
          if (this.repos[i].stargazers_count !== null && this.repos[i].stargazers_count > 0) {
            this.starsNameOfRepos.push(this.repos[i].name);
            this.starsOfRepos.push(this.repos[i].stargazers_count);
          }

          // Largest repository
          if (this.repos[i].size !== null && this.repos[i].size > 1000) {
            this.sizeNameOfRepos.push(this.repos[i].name);
            this.sizeOfRepos.push(this.repos[i].size);
          }

          // Most forked repository
          if (this.repos[i].forks_count !== null && this.repos[i].forks_count > 0) {
            this.forkNameOfRepos.push(this.repos[i].name);
            this.forkOfRepos.push(this.repos[i].forks_count);
          }
        }

        // Array for all languages in repos of one user
        let amountOfLanguageInReposWithoutNull = 0;
        for (let i = 0; i < this.reposAmount; i++) {
          if (this.repos[i].language !== null) {
            this.languageInRepos.push(this.repos[i].language);
            amountOfLanguageInReposWithoutNull++;
          }
        }

        // The same array without duplicates
        let languageInReposWithoutDuplicatesSet: Set<string>;
        languageInReposWithoutDuplicatesSet = new Set(this.languageInRepos);
        languageInReposWithoutDuplicatesSet.forEach(v => this.languageInReposWithoutDuplicates.push(v));

        // How often the coding language occurs in the array
        let numberOfLanguageInReposWithoutDuplicatesObj: any;
        numberOfLanguageInReposWithoutDuplicatesObj = this.countRandomStringElementDuplicatesInArray();
        this.numberOfLanguageInReposWithoutDuplicates = Object.values(numberOfLanguageInReposWithoutDuplicatesObj);

        // Needed for updating the pie chart
        this.pieChartDataNumberOfLanguages = {
          labels: this.languageInReposWithoutDuplicates,
          datasets: [
            {
              data: this.numberOfLanguageInReposWithoutDuplicates,
              backgroundColor: this.pieChartColors[0].backgroundColor,
            }
          ]
        };


        // Getting the coding languages of each repository
        this.repos.forEach((repo) => {
          this.usersService.getUserRepoLanguagesData(repo).subscribe(languages => {
              repo.languages = [];

              Object.keys(languages).forEach((key) => repo.languages?.push({
                  name: key,
                  frequency: languages[key]
                })
              );
            }
          );
        });

      },
      error: data => console.log('Error occurred during getting user repos', data)
    });
  }

  // LINKS METHODS
  linkToWebsite(userLink: string) {
    window.open(userLink, '_blank');
  }

  linkToEmail(emailLink: string) {
    window.open('mailto: ' + emailLink, '_blank');
  }

  // GENERAL METHODS
  // count number of random string element duplicates in array
  countRandomStringElementDuplicatesInArray() {
    const counts: number[] = [];
    this.languageInRepos.forEach((x: any) => {
      counts[x] = (counts[x] || 0) + 1;
    });
    return counts;
  }

  resetSearch() {
    this.user = undefined;
    this.username = '';
  }
}
