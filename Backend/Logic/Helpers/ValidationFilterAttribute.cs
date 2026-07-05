using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using System;

namespace Logic.Helpers
{
    public class ValidationFilterAttribute : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var allErrors = context.ModelState
                    .Where(e => e.Value != null && e.Value.Errors.Count > 0)
                    .SelectMany(e => e.Value!.Errors.Select(err => new { Field = e.Key, Error = err.ErrorMessage }))
                    .ToList();

                string customMessage = "Érvénytelen adatok lettek elküldve!";

                if (allErrors.Any())
                {
                    var dateError = allErrors.FirstOrDefault(e =>
                        e.Error.Contains("could not be converted to System.DateTime") ||
                        e.Error.Contains("JSON value could not be converted"));

                    if (dateError != null)
                    {
                        if (dateError.Field.Contains("birthDate", StringComparison.OrdinalIgnoreCase))
                        {
                            customMessage = "A születési dátum nem lett megadva, vagy formátuma nem megfelelő!";
                        }
                        else
                        {
                            customMessage = "Egy vagy több dátum nem lett megadva, vagy formátuma nem megfelelő!";
                        }
                    }
                    else
                    {

                        var meaningfulError = allErrors.FirstOrDefault(e => !e.Error.Contains("field is required") || e.Field != "dto")
                                              ?? allErrors.First();

                        customMessage = meaningfulError.Error;
                    }
                }

                throw new BadRequestException(customMessage);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}