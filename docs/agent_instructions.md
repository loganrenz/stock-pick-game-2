# Stock Pick Game Deployment Instructions

## Project Summary (from User)

We are creating a stock pick game app.

When the user first goes to stockpickgame.tideye.com they should see the current week's picks in a table. If it is on a weekend, we have to show the end result of the game including who the winner was. The winner is the user who had the best % gain from Monday's open to Friday's close.

We also need a facility for the three players to login (Patrick, Logan, and Taylor) and make their picks for the next week. They should be able to make a pick for the following week at any time up to the end of the day Sunday. If they fail to make a pick, their pick from the last week rolls over.

There should only be one screen: it shows the current week pick in a nice view and then the history of all previous weeks should be shown. The winner should be prominent on the page. We should include information about the stock that was picked, the price it was at Monday's open, and the price for each open and close for each day. If the day is a holiday, use the open and close of the previous day.

We need an authentication mechanism: we'll do a simple password strategy. Let's use a long-living JWT that lasts for a year and is updated whenever the user visits the page so that their login never expires. Let's use packages that are tried and tested for this but that are easy to use and understand.

Do you have any questions? If not, I want you to thoroughly review the current code base and setup and then get started on making changes to what we have now and don't stop until you have completed the assignment. There are both front end and back end components for the project. You may need to make changes in both. Fully review the code in the whole project before making decisions about how to proceed. Proceed without me and make your own choices and don't stop until it is done.

If there is additional tooling that needs to be installed, I will run those commands for you and you can continue on.

I want you to make all the changes for me to fix this the way it should be done. Review all the code base that you need to in order for this to be correct. Go ahead and do it all. Don't stop until you are done.

You can test for me too by curling the web page in some cases. If it is appropriate, please curl the web page and make sure a bug is fixed.

Please give yourself a unique name so that when I ask you for a summary in a little bit you can put it in the commit too.

---

## Prompt for the Next Agent

**Before you begin:**

- Read the entire `docs/agent_instructions.md` and `docs/agent_summaries.md` thoroughly.
- Make sure you fully understand the project scope, requirements, and the deployment setup.
- Pay special attention to the key instructions and project summary above.
- Remember: Always run scripts and commands on the user's behalf, and document any helpful instructions for future agents.
- Proceed with confidence, make your own choices, and do not stop until the assignment is complete.

## Access Information

- Production URL: <https://stockpickgame.tideye.com>
- SSH Access: `ssh vps` (configured in SSH config)
- Docker is used for containerization and deployment
- GitHub Actions handles CI/CD pipeline
- **Nginx Proxy Manager** is running on the VPS to manage domain routing
- **Cloudflare DNS** entry for stockpickgame.tideye.com points to the VPS
- **Nginx Proxy Manager** forwards stockpickgame.tideye.com to the Docker container on port 5173 (see NPM config)

> **Note:** All scripts and commands for investigation or deployment should be run on the user's behalf by the agent.

## Deployment Process

1. Code is pushed to the main branch
2. GitHub Actions workflow is triggered
3. Builds Docker images for frontend and backend
4. Deploys to production server
5. Updates containers using docker-compose

## Monitoring Deployment

To monitor the deployment process:

```bash
./monitor-actions.sh
```

This script will show the status of the latest GitHub Actions workflow.

## Common Issues

1. 502 Bad Gateway
   - Check if containers are running: `docker ps`
   - Check container logs: `docker logs <container_id>`
   - Verify Nginx Proxy Manager forwarding settings
   - Check if backend service is accessible from frontend

2. Database Issues
   - Database is located at `/data/dev.db`
   - Backup is created before each deployment
   - Can be restored from `prisma/dev-backup-*.db`

## Useful Commands

```bash
# SSH into server
ssh vps

# Check running containers
docker ps

# View container logs
docker logs <container_id>

# Restart services
docker-compose down
docker-compose up -d

# Monitor deployment
./monitor-actions.sh
```

## Environment Variables

Key environment variables needed:

- `JWT_SECRET`: For authentication
- `ALPHA_VANTAGE_API_KEY`: For stock data
- `FRONTEND_URL`: Frontend URL for CORS
- `PORT`: Backend port (default: 4556)

## Backup and Restore

Database backups are stored in:

- `prisma/dev-backup-*.db`

To restore from backup:

1. Stop the containers
2. Copy backup to `/data/dev.db`
3. Restart containers

## Troubleshooting

1. If site is down:
   - Check GitHub Actions status
   - Verify containers are running
   - Check Nginx Proxy Manager and backend logs
   - Verify database connection

2. If data is missing:
   - Check database backup
   - Verify database permissions
   - Check application logs

3. If authentication fails:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Verify user data in database
