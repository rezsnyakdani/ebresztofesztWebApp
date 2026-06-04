using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Data.Migrations
{
    /// <inheritdoc />
    public partial class InitSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkshopRegistrations",
                table: "WorkshopRegistrations");

            migrationBuilder.AddColumn<string>(
                name: "Id",
                table: "WorkshopRegistrations",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkshopRegistrations",
                table: "WorkshopRegistrations",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_WorkshopRegistrations_ProfileId_WorkshopSessionId",
                table: "WorkshopRegistrations",
                columns: new[] { "ProfileId", "WorkshopSessionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkshopRegistrations",
                table: "WorkshopRegistrations");

            migrationBuilder.DropIndex(
                name: "IX_WorkshopRegistrations_ProfileId_WorkshopSessionId",
                table: "WorkshopRegistrations");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "WorkshopRegistrations");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkshopRegistrations",
                table: "WorkshopRegistrations",
                columns: new[] { "ProfileId", "WorkshopSessionId" });
        }
    }
}
