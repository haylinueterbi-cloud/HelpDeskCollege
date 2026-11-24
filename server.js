require('dotenv').config();

const express = require('express');
const sql = require('mssql/msnodesqlv8');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Настройки подключения к SQL Server
const dbConfig = {
    connectionString:
        'Driver={ODBC Driver 18 for SQL Server};' +
        'Server=localhost,1433;' +
        'Database=HelpDeskCollege;' +
        'Trusted_Connection=Yes;' +
        'Encrypt=Yes;' +
        'TrustServerCertificate=Yes;'
};

// Проверка подключения к базе данных
app.get('/api/test', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(
            'SELECT DB_NAME() AS DatabaseName'
        );

        res.json({
            success: true,
            message: 'Подключение к SQL Server успешно!',
            database: result.recordset[0].DatabaseName
        });

    } catch (error) {
        console.error('DATABASE ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Получение всех заявок из SQL Server
app.get('/api/requests', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
            SELECT
    r.RequestID,
    r.Title,
    r.Description,
    r.Status,
    r.Priority,
    r.CategoryID,
    c.CategoryName AS Category,
    r.CreatedAt
FROM Requests r
INNER JOIN Categories c
    ON r.CategoryID = c.CategoryID
ORDER BY r.RequestID
        `);

        res.json({
            success: true,
            requests: result.recordset
        });

    } catch (error) {
        console.error('REQUESTS ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Не удалось получить заявки из базы данных'
        });
    }
});
// Получение категорий
app.get('/api/categories', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
            SELECT CategoryID, CategoryName
            FROM Categories
            ORDER BY CategoryID
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('CATEGORIES ERROR:', error);
        res.status(500).json({ success: false });
    }
});

// Получение пользователей
app.get('/api/users', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
            SELECT UserID, Login, FullName, Role
            FROM Users
            ORDER BY UserID
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('USERS ERROR:', error);
        res.status(500).json({ success: false });
    }
});
// Изменение статуса заявки
app.patch('/api/requests/:id/status', async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const newStatus = req.body.status;

        const allowedStatuses = [
            'Новая',
            'В работе',
            'Завершена',
            'Отклонена'
        ];

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный номер заявки'
            });
        }

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Недопустимый статус'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('id', sql.Int, requestId)
            .input('status', sql.NVarChar, newStatus)
            .query(`
                UPDATE Requests
                SET Status = @status,
                    UpdatedAt = SYSDATETIME()
                WHERE RequestID = @id;

                SELECT @@ROWCOUNT AS AffectedRows;
            `);

        if (result.recordset[0].AffectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            });
        }

        res.json({
            success: true,
            message: 'Статус заявки обновлён'
        });

    } catch (error) {
        console.error('STATUS UPDATE ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Ошибка при изменении статуса'
        });
    }
});
// Создание новой заявки
app.post('/api/requests', async (req, res) => {
    try {
        const { title, description, categoryId } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Название заявки обязательно'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('title', sql.NVarChar, title.trim())
            .input('description', sql.NVarChar, description || null)
            .input('categoryId', sql.Int, Number(categoryId))
            .input('createdBy', sql.Int, 2)
            .query(`
                INSERT INTO Requests
                    (Title, Description, CategoryID, CreatedBy)
                OUTPUT INSERTED.RequestID
                VALUES
                    (@title, @description, @categoryId, @createdBy);
            `);

        res.status(201).json({
            success: true,
            message: 'Заявка успешно создана',
            requestId: result.recordset[0].RequestID
        });

    } catch (error) {
        console.error('CREATE REQUEST ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Не удалось создать заявку'
        });
    }
});
// Удаление заявки
app.delete('/api/requests/:id', async (req, res) => {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный номер заявки'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('id', sql.Int, requestId)
            .query(`
                DELETE FROM Requests
                WHERE RequestID = @id;

                SELECT @@ROWCOUNT AS AffectedRows;
            `);

        if (result.recordset[0].AffectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            });
        }

        res.json({
            success: true,
            message: 'Заявка удалена'
        });

    } catch (error) {
        console.error('DELETE REQUEST ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Не удалось удалить заявку. Возможно, у неё есть история изменений.'
        });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});