// cli/index.ts
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createOpencodeClient, type Session, type Message, type OpencodeEvent } from '../lib/opencode.js';

const program = new Command();

program
  .name('opencode-cli')
  .description('CLI tool for testing the OpenCode API')
  .version('1.0.0')
  .option('-u, --url <url>', 'OpenCode API base URL', 'http://localhost:4096');

program
  .command('interactive')
  .description('Start interactive session')
  .action(async () => {
    const options = program.opts();
    const client = createOpencodeClient({ baseUrl: options.url });

    console.log(chalk.blue('🚀 Welcome to OpenCode CLI Tester'));
    console.log(chalk.gray(`Connected to: ${options.url}`));
    console.log('');

    let session: Session | null = null;
    let eventDisconnect: (() => void) | null = null;

    // Start event monitoring
    console.log(chalk.yellow('📡 Starting event monitoring...'));
    eventDisconnect = client.connectEvents((event: OpencodeEvent) => {
      console.log(chalk.magenta(`📢 Event: ${event.type}`), event.data);
    });

    try {
      // Create session
      console.log(chalk.blue('🔄 Creating session...'));
      session = await client.createSession();
      console.log(chalk.green(`✅ Session created: ${session.id}`));
      console.log('');

      while (true) {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '📤 Send a message', value: 'send' },
              { name: '📖 View message history', value: 'history' },
              { name: '🔄 Refresh messages', value: 'refresh' },
              { name: '❌ Exit', value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') {
          break;
        }

        if (action === 'send') {
          const { message } = await inquirer.prompt([
            {
              type: 'input',
              name: 'message',
              message: 'Enter your message:',
              validate: (input) => input.trim().length > 0 || 'Message cannot be empty',
            },
          ]);

          try {
            console.log(chalk.blue('📤 Sending message...'));
            const sentMessage = await client.sendMessage(session.id, message);
            console.log(chalk.green(`✅ Message sent (ID: ${sentMessage.id})`));

            // Auto-refresh messages
            const messages = await client.getMessages(session.id);
            displayMessages(messages);
          } catch (error) {
            console.error(chalk.red('❌ Failed to send message:'), error.message);
          }
        }

        if (action === 'history' || action === 'refresh') {
          try {
            console.log(chalk.blue('📖 Loading messages...'));
            const messages = await client.getMessages(session.id);
            displayMessages(messages);
          } catch (error) {
            console.error(chalk.red('❌ Failed to load messages:'), error.message);
          }
        }

        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    } finally {
      if (eventDisconnect) {
        eventDisconnect();
        console.log(chalk.yellow('📡 Event monitoring stopped'));
      }
    }
  });

program
  .command('session create')
  .description('Create a new session')
  .action(async () => {
    const options = program.opts();
    const client = createOpencodeClient({ baseUrl: options.url });

    try {
      console.log(chalk.blue('🔄 Creating session...'));
      const session = await client.createSession();
      console.log(chalk.green(`✅ Session created: ${session.id}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to create session:'), error.message);
      process.exit(1);
    }
  });

program
  .command('send-message <sessionId> <content>')
  .description('Send a message to a session')
  .action(async (sessionId: string, content: string) => {
    const options = program.opts();
    const client = createOpencodeClient({ baseUrl: options.url });

    try {
      console.log(chalk.blue('📤 Sending message...'));
      const message = await client.sendMessage(sessionId, content);
      console.log(chalk.green(`✅ Message sent (ID: ${message.id})`));
      console.log(chalk.gray(`Role: ${message.role}`));
      console.log(chalk.gray(`Timestamp: ${message.timestamp}`));
      console.log('');
      console.log(message.content);
    } catch (error) {
      console.error(chalk.red('❌ Failed to send message:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list-messages <sessionId>')
  .description('List messages in a session')
  .action(async (sessionId: string) => {
    const options = program.opts();
    const client = createOpencodeClient({ baseUrl: options.url });

    try {
      console.log(chalk.blue('📖 Loading messages...'));
      const messages = await client.getMessages(sessionId);
      displayMessages(messages);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load messages:'), error.message);
      process.exit(1);
    }
  });

program
  .command('events monitor')
  .description('Monitor real-time events')
  .action(async () => {
    const options = program.opts();
    const client = createOpencodeClient({ baseUrl: options.url });

    console.log(chalk.yellow('📡 Monitoring events... Press Ctrl+C to stop'));

    const disconnect = client.connectEvents((event: OpencodeEvent) => {
      const timestamp = event.timestamp || new Date().toISOString();
      console.log(chalk.magenta(`[${timestamp}] Event: ${event.type}`));
      console.log(JSON.stringify(event.data, null, 2));
      console.log('');
    });

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n📡 Stopping event monitoring...'));
      disconnect();
      process.exit(0);
    });

    // Keep alive
    setInterval(() => {}, 1000);
  });

function displayMessages(messages: Message[]) {
  if (messages.length === 0) {
    console.log(chalk.gray('No messages yet'));
    return;
  }

  console.log('');
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? chalk.blue('👤 User') : chalk.green('🤖 Assistant');
    const timestamp = new Date(msg.timestamp).toLocaleString();
    console.log(`${index + 1}. ${role} (${chalk.gray(timestamp)})`);
    console.log(`   ${msg.content}`);
    console.log('');
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

program.parse();