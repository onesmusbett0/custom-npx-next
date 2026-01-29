import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import cors from 'cors';

const execAsync = promisify(exec);

const app = express();

// Configure CORS properly
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST'],
  credentials: true
}));

app.use(express.json());

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

interface ProjectConfig {
    projectName: string;
    templatePath: string;
    initGit: boolean;
    openVSCode: boolean;
    basePath?: string;
}

const templatesPath = path.join(__dirname, '..', 'templates');
// Prefer the CLI-provided base path; otherwise, default to the parent of `api/`
// so we don't accidentally write into the `api` folder when running via `cd api && npm run dev`.
const projectsBasePathEnv = process.env.CREATE_CUSTOM_CWD;
const projectsBasePathDefault = path.join(__dirname, '..');
const projectsBasePath = projectsBasePathEnv || projectsBasePathDefault;

app.post('/api/create-project', async (req, res) => {
    try {

        const { projectName, templatePath, initGit, openVSCode, basePath }: ProjectConfig = req.body;


        // Validate project name
        if (!projectName.match(/^[a-zA-Z0-9-_]+$/)) {
            throw new Error('Invalid project name');
        }

        // Prefer explicit basePath sent by the UI (which got it from the CLI's env),
        // otherwise fall back to env/cwd.
        const resolvedBasePath =
            typeof basePath === 'string' && basePath.length > 0 && path.isAbsolute(basePath)
                ? basePath
                : projectsBasePath;

        // Scaffold relative to where the CLI was invoked from (not `api/`'s cwd).
        const projectPath = path.join(resolvedBasePath, projectName);

        console.log('[create-custom] basePath(body)=', basePath);
        console.log('[create-custom] projectsBasePath(env/default)=', projectsBasePath);
        console.log('[create-custom] resolvedBasePath=', resolvedBasePath);
        console.log('[create-custom] projectPath=', projectPath);


        // Check if directory already exists
        if (await fs.pathExists(projectPath)) {
            throw new Error('Project directory already exists');
        }

        // Create project directory
        await fs.ensureDir(projectPath);

        // Copy template files
        const sourcePath = path.join(templatesPath, templatePath);
        if (!await fs.pathExists(sourcePath)) {
            throw new Error('Template not found');
        }

        await fs.copy(sourcePath, projectPath);

        // Initialize git if requested
        if (initGit) {
            await execAsync('git init', { cwd: projectPath });
        }

        // Open VS Code if requested
        if (openVSCode) {
            await execAsync('code .', { cwd: projectPath });
        }

        res.json({ 
            success: true,  
            message: `Project ${projectName} created successfully` 
        });
    } catch (error: any) {
        console.error('Error creating project:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error creating project' 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});